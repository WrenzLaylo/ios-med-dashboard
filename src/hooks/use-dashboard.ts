import { useState, useEffect, useMemo } from 'react';
import { RESOURCES, ResourceKey, FIELD_TYPES } from '@/app/dashboard/config';

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export function useDashboard() {
  // --- States ---
  const [activeTab, setActiveTab] = useState<ResourceKey>('Patient');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showChat, setShowChat] = useState(false);

  // UI States
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showDock, setShowDock] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Modal States
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const [editFormData, setEditFormData] = useState<any>({});
  const [addFormData, setAddFormData] = useState<any>({});
  const [patientList, setPatientList] = useState<any[]>([]);

  // Pagination & Stats
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, activePractitioners: 0, pendingSchedules: 0 });
  const pageSize = 50;

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const params = new URLSearchParams({ resource: 'Patient', fields: JSON.stringify(["name", "patient_name"]), limit_start: '0', limit_page_length: '999999' });
        const res = await fetch(`/api/proxy?${params}`);
        const result = await res.json();
        setPatientList(result.data || []);
      } catch (err) { console.error('Error fetching patients:', err); }
    }
    fetchPatients();
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [activeTab, currentPage]);

  // --- Helpers ---
  const showToast = (type: 'success' | 'error' | 'info', message: string) => setToastMessage({ type, message });

  async function fetchStats() {
    try {
      // Simplified for brevity - keep original logic here
      const [pRes, aRes, drRes] = await Promise.all([
        fetch(`/api/proxy?resource=Patient&fields=["name"]&limit_page_length=99999`),
        fetch(`/api/proxy?resource=Patient Appointment&fields=["name","appointment_date","status"]&limit_page_length=99999`),
        fetch(`/api/proxy?resource=Healthcare Practitioner&fields=["name","status"]&limit_page_length=99999`)
      ]);
      const [pData, aData, drData] = await Promise.all([pRes.json(), aRes.json(), drRes.json()]);

      const today = new Date().toISOString().split('T')[0];
      setStats({
        totalPatients: pData.data?.length || 0,
        todayAppointments: aData.data?.filter((a: any) => a.appointment_date === today).length || 0,
        activePractitioners: drData.data?.filter((p: any) => p.status === 'Active').length || 0,
        pendingSchedules: 0
      });
    } catch (err) { console.error('Error fetching stats:', err); }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const config = RESOURCES[activeTab];
      const countRes = await fetch(`/api/proxy?resource=${activeTab}&fields=["name"]&limit_page_length=999999`);
      const countResult = await countRes.json();
      setTotalRecords(countResult.data?.length || 0);

      const params = new URLSearchParams({
        resource: activeTab, fields: config.fields,
        limit_start: String((currentPage - 1) * pageSize),
        limit_page_length: String(pageSize)
      });
      const res = await fetch(`/api/proxy?${params}`);
      const result = await res.json();
      setData(result.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // --- Filter Logic ---
  const filteredAndSortedData = useMemo(() => {
    let result = data;
    if (debouncedSearchTerm) {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      result = result.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(lowerTerm)));
    }
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value) result = result.filter(item => item[field] === value);
    });
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === bVal) return 0;
        return sortConfig.direction === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal < bVal ? 1 : -1);
      });
    }
    return result;
  }, [data, debouncedSearchTerm, activeFilters, sortConfig]);

  // --- Handlers ---
  const handleSort = (key: string) => {
    setSortConfig(current => (current?.key === key && current.direction === 'asc') ? { key, direction: 'desc' } : { key, direction: 'asc' });
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedRows(newSelection);
  };

  const openDetail = (row: any) => { setSelectedRow(row); setIsDetailOpen(true); };

  const openEdit = (row: any) => {
    const config = RESOURCES[activeTab];
    // @ts-ignore
    const fieldsToEdit = config.updateFields || config.createFields || config.columns;
    const initialData: any = { name: row.name };
    fieldsToEdit.forEach((field: string) => {
      initialData[field] = row[field] !== undefined ? row[field] : (FIELD_TYPES[field]?.default ?? '');
    });
    setEditFormData(initialData);
    setIsEditOpen(true);
    setIsDetailOpen(false);
  };

  const openAdd = () => {
    const config = RESOURCES[activeTab];
    const emptyForm: any = {};
    // @ts-ignore
    const fields = config.createFields || config.columns;
    fields.forEach((col: string) => {
      emptyForm[col] = FIELD_TYPES[col]?.default ?? '';
    });
    setAddFormData(emptyForm);
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    const isCreating = isAddOpen;
    const currentData = isCreating ? addFormData : editFormData;
    if (!currentData || Object.keys(currentData).length === 0) return showToast('error', 'Please fill in the form fields');

    let payloadData = { ...currentData };
    if (!isCreating) {
      ['creation', 'modified', 'owner', 'docstatus', 'idx', '_user_tags', '_comments', '_assign', '_liked_by'].forEach(f => delete payloadData[f]);
    }

    try {
      showToast('info', isCreating ? 'Creating record...' : 'Updating record...');
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: activeTab, action: isCreating ? 'create' : 'update', data: payloadData, name: isCreating ? undefined : currentData.name })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setIsAddOpen(false); setIsEditOpen(false); setAddFormData({}); setEditFormData({});
      showToast('success', 'Success!');
      fetchData(); fetchStats();
    } catch (error: any) { showToast('error', error.message); }
  };

  const handleDelete = async () => {
    if (!selectedRow?.name) return;
    try {
      showToast('info', 'Deleting...');
      const res = await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: activeTab, name: selectedRow.name }) });
      if (!res.ok) throw new Error((await res.json()).message);
      showToast('success', 'Deleted');
      setIsDetailOpen(false); setSelectedRow(null); setShowDeleteConfirm(false);
      fetchData(); fetchStats();
    } catch (error: any) { showToast('error', error.message); }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;
    try {
      showToast('info', `Deleting ${selectedRows.size} records...`);
      await Promise.all(Array.from(selectedRows).map(async (index) => {
        const row = filteredAndSortedData[index];
        const res = await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: activeTab, name: row.name }) });
        if (!res.ok) throw new Error();
      }));
      showToast('success', 'Batch delete successful');
      setSelectedRows(new Set()); fetchData(); fetchStats();
    } catch (e) { showToast('error', 'Batch delete failed'); }
  };

  return {
    // State
    activeTab, setActiveTab, data, loading, searchTerm, setSearchTerm,
    debouncedSearchTerm, activeFilters, setActiveFilters, sortConfig, showChat, setShowChat,
    selectedRows, setSelectedRows, viewMode, setViewMode, showFilters, setShowFilters,
    showDock, setShowDock, showQuickActions, setShowQuickActions,
    selectedRow, setSelectedRow, isDetailOpen, setIsDetailOpen,
    isEditOpen, setIsEditOpen, isAddOpen, setIsAddOpen, showDeleteConfirm, setShowDeleteConfirm,
    editFormData, setEditFormData, addFormData, setAddFormData, patientList,
    currentPage, setCurrentPage, totalRecords, stats, pageSize, toastMessage,

    // Derived
    filteredAndSortedData,

    // Actions
    fetchData, fetchStats, handleSort, toggleRowSelection, openDetail, openEdit, openAdd,
    handleSave, handleDelete, handleBatchDelete, showToast
  };
}