'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronRight, LayoutList, X, Calendar, Users, Activity, RefreshCw, Plus, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Mail, Phone, FileText, Clock, LogOut, Settings, User, ChevronLeft, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Configuration for your Resources ---
const RESOURCES = {
  Patient: {
    label: 'Patients',
    fields: JSON.stringify(["name", "patient_name", "first_name", "last_name", "sex", "mobile", "email", "user_id", "age_html"]),
    columns: ['name', 'patient_name', 'mobile', 'email'],
    filterableFields: ['sex', 'email'],
    createFields: ['first_name', 'last_name', 'sex', 'mobile', 'email', 'user_id', 'age'], // Form shows 'age'
    fieldMapping: { age: 'age_html' }, // Maps 'age' -> 'age_html' when sending to API
    icon: Users,
    quickActions: [
      { label: 'New Patient', icon: Plus, color: 'blue' },
      { label: 'Import Patients', icon: FileText, color: 'green' },
      { label: 'Send SMS', icon: Phone, color: 'purple' }
    ]
  },
  'Patient Appointment': {
    label: 'Appointments',
    fields: JSON.stringify(["name", "patient", "patient_name", "appointment_type", "appointment_date", "appointment_time", "status", "duration", "company", "department"]),
    columns: ['name', 'patient_name', 'appointment_date', 'appointment_time', 'status'],
    filterableFields: ['status', 'appointment_type', 'appointment_date'],
    createFields: [
      'naming_series',
      'company',
      'appointment_date',
      'appointment_type',
      'patient',
      'duration',
      'appointment_time',
      'custom_1',
      'custom_2',
      'custom_seat_1',
      'custom_seat_2',
      'mode_of_payment',
      'paid_amount',
      'notes'
    ],
    requiredFields: ['company', 'appointment_date', 'appointment_type', 'patient', 'duration', 'appointment_time'],
    icon: Calendar,
    quickActions: [
      { label: 'New Appointment', icon: Plus, color: 'blue' },
      { label: 'Schedule Batch', icon: Calendar, color: 'green' },
      { label: 'Send Reminders', icon: Mail, color: 'purple' }
    ]
  },
  'Healthcare Practitioner': {
    label: 'Practitioners',
    fields: JSON.stringify(["first_name", "status", "mobile_phone", "name"]),
    columns: ['first_name', 'status', 'mobile_phone', 'name'],
    filterableFields: ['status'],
    icon: Activity,
    quickActions: [
      { label: 'Add Practitioner', icon: Plus, color: 'blue' },
      { label: 'Manage Schedules', icon: Clock, color: 'green' },
      { label: 'Update Status', icon: Edit, color: 'purple' }
    ]
  },
  'Practitioner Schedule': {
    label: 'Schedules',
    fields: JSON.stringify(["name", "docstatus", "schedule_name"]),
    columns: ['name', 'docstatus', 'schedule_name'],
    filterableFields: ['docstatus'],
    icon: LayoutList,
    quickActions: [
      { label: 'Create Schedule', icon: Plus, color: 'blue' },
      { label: 'Bulk Update', icon: Edit, color: 'green' },
      { label: 'Export Schedules', icon: FileText, color: 'purple' }
    ]
  }
};

type ResourceKey = keyof typeof RESOURCES;
type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

// Field type definitions for form inputs
const FIELD_TYPES: Record<string, { type: string; options?: string[]; placeholder?: string; default?: any }> = {
  sex: { type: 'select', options: ['Male', 'Female'] },
  email: { type: 'email', placeholder: 'email@example.com' },
  mobile: { type: 'tel', placeholder: '09XX XXX XXXX' },
  age: { type: 'number', placeholder: 'Age in years' },
  first_name: { type: 'text', placeholder: 'First name' },
  last_name: { type: 'text', placeholder: 'Last name' },
  user_id: { type: 'text', placeholder: 'User ID' },
  status: { type: 'select', options: ['Active', 'Inactive', 'Disabled'] },
  department: { type: 'text', placeholder: 'Department name' },
  title: { type: 'text' },
  schedule_name: { type: 'text' },
  mobile_phone: { type: 'tel', placeholder: '09XX XXX XXXX' },
  docstatus: { type: 'select', options: ['0', '1', '2'] },
  
  // Patient Appointment fields
  company: { type: 'text', default: 'ebizolution' },
  naming_series: { type: 'text', default: 'HLC-APP-.YYYY.-' },
  appointment_type: { type: 'text', placeholder: 'e.g., Consultation, Follow-up' },
  appointment_date: { type: 'date' },
  patient: { type: 'text', placeholder: 'Select patient' },
  duration: { type: 'number', placeholder: 'Duration in minutes', default: '30' },
  appointment_time: { type: 'time' },
  custom_1: { type: 'number', placeholder: 'Chamber 1' },
  custom_2: { type: 'number', placeholder: 'Chamber 2' },
  custom_seat_1: { type: 'text', placeholder: 'Seat 1' },
  custom_seat_2: { type: 'text', placeholder: 'Seat 2' },
  mode_of_payment: { type: 'text', placeholder: 'Cash, Card, etc.' },
  invoiced: { type: 'select', options: ['0', '1'] },
  paid_amount: { type: 'number', placeholder: '0.00' },
  referring_practitioner: { type: 'text', placeholder: 'Referring doctor' },
  appointment_based_on_check_in: { type: 'select', options: ['0', '1'] },
  notes: { type: 'textarea', placeholder: 'Additional notes' },
};

export default function IOSDashboard() {
  const [activeTab, setActiveTab] = useState<ResourceKey>('Patient');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [patientList, setPatientList] = useState<any[]>([]); // For patient dropdown
  
  // Fetch patient list for dropdowns
  useEffect(() => {
    async function fetchPatients() {
      try {
        const params = new URLSearchParams({
          resource: 'Patient',
          fields: JSON.stringify(["name", "patient_name"]),
          limit_start: '0',
          limit_page_length: '999999'
        });
        const res = await fetch(`/api/proxy?${params}`);
        const result = await res.json();
        setPatientList(result.data || []);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    }
    fetchPatients();
  }, []);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [addFormData, setAddFormData] = useState<any>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(100); // Default to 100 records

  // Fetch data when tab changes or page changes
  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, pageSize]);

  async function fetchData() {
    setLoading(true);
    try {
      const config = RESOURCES[activeTab];
      
      // First, get the total count
      const countParams = new URLSearchParams({
        resource: activeTab,
        fields: JSON.stringify(["name"]),
        limit_start: '0',
        limit_page_length: '999999' // Get all to count
      });
      
      try {
        const countRes = await fetch(`/api/proxy?${countParams}`);
        const countResult = await countRes.json();
        setTotalRecords(countResult.data?.length || 0);
      } catch (err) {
        console.error('Error fetching count:', err);
      }
      
      // Then get the actual page data
      const params = new URLSearchParams({
        resource: activeTab,
        fields: config.fields,
        limit_start: String((currentPage - 1) * pageSize),
        limit_page_length: String(pageSize)
      });

      const res = await fetch(`/api/proxy?${params}`);
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Manual refresh with animation
  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  }

  // Sort handler
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Get unique values for filter fields
  const getFilterOptions = (field: string) => {
    const values = data.map(item => item[field]).filter(Boolean);
    return [...new Set(values)];
  };

  // Filter and Sort Logic
  const filteredAndSortedData = useMemo(() => {
    let result = data;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(lowerTerm)
        )
      );
    }

    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => item[field] === value);
      }
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, sortConfig]);

  const toggleFilter = (field: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [field]: prev[field] === value ? '' : value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setSortConfig(null);
  };

  const openDetailModal = (row: any) => {
    setSelectedRow(row);
    setShowDetailModal(true);
  };

  const openEditModal = (row: any) => {
    setEditFormData({ ...row });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const openAddModal = () => {
    const config = RESOURCES[activeTab];
    const emptyForm: any = {};
    // Use createFields if available, otherwise fall back to columns
    const fieldsToUse = (config as any).createFields || config.columns;
    fieldsToUse.forEach((col: string) => {
      // Set default values if defined
      const fieldDef = FIELD_TYPES[col];
      if (fieldDef?.default !== undefined) {
        emptyForm[col] = fieldDef.default;
      } else {
        emptyForm[col] = '';
      }
    });
    setAddFormData(emptyForm);
    setShowAddModal(true);
    setShowQuickActions(false);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: activeTab,
          name: editFormData.name,
          data: editFormData
        })
      });

      if (response.ok) {
        alert('Record updated successfully!');
        setShowEditModal(false);
        // Refresh the data to get computed fields like full_name
        await fetchData();
      } else {
        const result = await response.json();
        alert(`Failed to update record: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating record');
    }
  };

  const handleAddSubmit = async () => {
    const config = RESOURCES[activeTab] as any;
    const requiredFields = config.requiredFields || [];
    
    // Basic validation for Patient
    if (activeTab === 'Patient') {
      if (!addFormData.first_name || !addFormData.last_name || !addFormData.sex) {
        alert('Please fill in all required fields: First Name, Last Name, and Sex');
        return;
      }
    }
    
    // Validation for Patient Appointment
    if (activeTab === 'Patient Appointment') {
      const missingFields = requiredFields.filter((field: string) => !addFormData[field]);
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.map((f: string) => f.replace(/_/g, ' ')).join(', ')}`);
        return;
      }
    }

    try {
      // Remove empty fields
      const cleanData = Object.fromEntries(
        Object.entries(addFormData).filter(([_, value]) => value !== '')
      );

      // Apply field mapping if exists (e.g., age -> age_html)
      const mappedData: any = {};
      
      Object.entries(cleanData).forEach(([key, value]) => {
        // Check if this field needs to be mapped to a different API field name
        const apiFieldName = config.fieldMapping?.[key] || key;
        mappedData[apiFieldName] = value;
      });

      console.log('Submitting data:', mappedData);

      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: activeTab,
          data: mappedData
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Record created successfully!');
        setShowAddModal(false);
        fetchData();
      } else {
        console.error('Server error:', result);
        alert(`Failed to create record: ${result.error?.message || result.message || result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('Error creating record. Please check the console for details.');
    }
  };

  const handleDeleteRecord = async (recordName: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: activeTab,
          name: recordName
        })
      });

      if (response.ok) {
        alert('Record deleted successfully!');
        setShowDetailModal(false);
        fetchData();
      } else {
        alert('Failed to delete record');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting record');
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const hasActiveFilters = Object.values(activeFilters).some(v => v) || searchTerm || sortConfig;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F2F7] via-[#E5E5EA] to-[#F2F2F7] text-slate-900 font-sans pb-10">
      
      {/* iOS Header with darker blue gradient */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#4A5FCC] flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300 ease-out">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Health Data
            </h1>
          </div>
          
          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0066CC] to-[#4A5FCC] flex items-center justify-center text-white font-semibold text-xs shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out cursor-pointer"
            >
              JD
            </button>
            
            {showProfileMenu && (
              <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-2 min-w-[200px] animate-in slide-in-from-top-5 fade-in duration-300">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 text-left">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 text-left">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Settings</span>
                </button>
                <div className="h-px bg-slate-200 my-2"></div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-left">
                  <LogOut className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        
        {/* iOS Segmented Control with darker blue */}
        <div className="bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl flex space-x-1 overflow-x-auto no-scrollbar shadow-sm border border-slate-200/50">
          {(Object.keys(RESOURCES) as ResourceKey[]).map((key) => {
            const Icon = RESOURCES[key].icon;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setSearchTerm('');
                  setActiveFilters({});
                  setSortConfig(null);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap flex items-center justify-center gap-2 relative overflow-hidden",
                  "transition-all duration-500 ease-out", // Smooth transition
                  activeTab === key 
                    ? "text-white shadow-lg scale-105 z-10" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50 hover:scale-102"
                )}
              >
                {/* Animated background gradient */}
                {activeTab === key && (
                  <span className="absolute inset-0 bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] animate-in slide-in-from-left-full duration-500 ease-out"></span>
                )}
                <Icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{RESOURCES[key].label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#0066CC] transition-colors duration-300" />
          </div>
          <input
            type="text"
            placeholder={`Search ${RESOURCES[activeTab].label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/60 backdrop-blur-xl hover:bg-white/80 focus:bg-white transition-all duration-300 pl-12 pr-4 py-4 rounded-2xl text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:shadow-lg focus:scale-[1.02] transform border border-slate-200/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-4 flex items-center hover:scale-110 transition-transform duration-200"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 border border-red-200"
              >
                <X className="h-4 w-4" />
                Clear All
              </button>
            )}
            {Object.entries(activeFilters).map(([field, value]) => 
              value ? (
                <span
                  key={field}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2 border border-blue-200 animate-in fade-in slide-in-from-left-5 duration-300"
                >
                  {field}: {value}
                  <button
                    onClick={() => toggleFilter(field, value)}
                    className="hover:scale-110 transition-transform"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null
            )}
            {sortConfig && (
              <span className="px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium flex items-center gap-2 border border-purple-200 animate-in fade-in slide-in-from-left-5 duration-300">
                Sorted: {sortConfig.key} {sortConfig.direction === 'asc' ? '↑' : '↓'}
                <button
                  onClick={() => setSortConfig(null)}
                  className="hover:scale-110 transition-transform"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-white/60 backdrop-blur-xl hover:bg-white border border-slate-200/50 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={cn("h-5 w-5 text-[#0066CC]", refreshing && "animate-spin")} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-3 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-sm border",
                showFilters 
                  ? "bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white border-transparent" 
                  : "bg-white/60 backdrop-blur-xl hover:bg-white text-[#0066CC] border-slate-200/50"
              )}
            >
              <Filter className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
              className="p-3 bg-white/60 backdrop-blur-xl hover:bg-white border border-slate-200/50 rounded-xl transition-all duration-300 transform hover:scale-110 text-[#0066CC] shadow-sm"
            >
              <LayoutList className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-6 animate-in slide-in-from-top-5 fade-in duration-300">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Filter Options</h3>
            <div className="space-y-4">
              {RESOURCES[activeTab].filterableFields.map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getFilterOptions(field).map(option => (
                      <button
                        key={option}
                        onClick={() => toggleFilter(field, String(option))}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 border",
                          activeFilters[field] === option
                            ? "bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white border-transparent shadow-md"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Display */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-white/50">
            <h2 className="text-lg font-semibold text-slate-900">{RESOURCES[activeTab].label}</h2>
            <div className="text-sm text-slate-500">
              {filteredAndSortedData.length} {filteredAndSortedData.length === 1 ? 'record' : 'records'}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-200 border-t-[#0066CC] animate-spin"></div>
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-[#4A5FCC] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                </div>
              </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium">No records found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : viewMode === 'table' ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-600">
                  <tr>
                    {RESOURCES[activeTab].columns.map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-6 py-4 font-semibold capitalize tracking-wide cursor-pointer hover:bg-slate-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {col.replace(/_/g, ' ')}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {sortConfig?.key === col ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-[#0066CC]" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-[#0066CC]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 sr-only">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedData.map((row, i) => (
                    <tr
                      key={i}
                      onClick={() => openDetailModal(row)}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 group cursor-pointer transform hover:scale-[1.01]"
                    >
                      {RESOURCES[activeTab].columns.map((col) => (
                        <td key={`${i}-${col}`} className="px-6 py-4 text-slate-700">
                          {col === 'status' || col === 'docstatus' ? (
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 transform group-hover:scale-105 inline-block",
                              row[col] === 'Open' || row[col] === 'Active' || row[col] === 1 ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm" :
                              row[col] === 'Closed' || row[col] === 0 ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200" :
                              "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm"
                            )}>
                              {row[col] === 1 ? 'Submitted' : row[col] === 0 ? 'Draft' : row[col]}
                            </span>
                          ) : (
                            <span className="group-hover:text-slate-900 transition-colors">{row[col]}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0066CC] group-hover:translate-x-1 inline-block transition-all duration-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {filteredAndSortedData.map((row, i) => (
                  <div
                    key={i}
                    onClick={() => openDetailModal(row)}
                    className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/50 rounded-2xl p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="space-y-3">
                      {RESOURCES[activeTab].columns.map((col) => (
                        <div key={col} className="flex justify-between items-start gap-3">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {col.replace(/_/g, ' ')}
                          </span>
                          {col === 'status' || col === 'docstatus' ? (
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-semibold border",
                              row[col] === 'Open' || row[col] === 'Active' || row[col] === 1 ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200" :
                              row[col] === 'Closed' || row[col] === 0 ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200" :
                              "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200"
                            )}>
                              {row[col] === 1 ? 'Submitted' : row[col] === 0 ? 'Draft' : row[col]}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-900 text-right">{row[col]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0066CC] group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200/50 bg-gradient-to-r from-slate-50/30 to-white/30 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="200">200 per page</option>
                <option value="500">500 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              
              <span className="text-sm font-medium text-slate-700 px-3">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {showQuickActions && (
            <div className="absolute bottom-20 right-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-3 min-w-[240px] animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="space-y-2">
                {RESOURCES[activeTab].quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (action.label.toLowerCase().includes('new') || action.label.toLowerCase().includes('add') || action.label.toLowerCase().includes('create')) {
                          openAddModal();
                        } else {
                          console.log(`Action: ${action.label}`);
                          setShowQuickActions(false);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 text-left",
                        action.color === 'blue' && "bg-blue-50 hover:bg-blue-100 text-blue-700",
                        action.color === 'green' && "bg-green-50 hover:bg-green-100 text-green-700",
                        action.color === 'purple' && "bg-purple-50 hover:bg-purple-100 text-purple-700"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              "h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95",
              showQuickActions 
                ? "bg-gradient-to-br from-red-500 to-pink-600 rotate-45" 
                : "bg-gradient-to-br from-[#0066CC] to-[#4A5FCC]"
            )}
          >
            <Plus className="h-8 w-8 text-white" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRow && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 fade-in duration-300 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-8 relative">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold mb-2">{RESOURCES[activeTab].label} Details</h2>
              <p className="text-blue-100 text-sm">View and manage record information</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key} className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </label>
                    {key === 'status' || key === 'docstatus' ? (
                      <span className={cn(
                        "inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border",
                        value === 'Open' || value === 'Active' || value === 1 ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200" :
                        value === 'Closed' || value === 0 ? "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200" :
                        "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200"
                      )}>
                        {value === 1 ? 'Submitted' : value === 0 ? 'Draft' : String(value)}
                      </span>
                    ) : (
                      <p className="text-slate-900 font-medium text-lg">{String(value)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => openEditModal(selectedRow)}
                className="flex-1 bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="flex-1 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </button>
              <button
                onClick={() => handleDeleteRecord(selectedRow.name)}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-8 relative">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold mb-2">Edit {RESOURCES[activeTab].label}</h2>
              <p className="text-blue-100 text-sm">Update record information</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(editFormData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] outline-none transition-all"
                      disabled={key === 'name'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-8 relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold mb-2">Add New {RESOURCES[activeTab].label}</h2>
              <p className="text-blue-100 text-sm">Create a new record</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(addFormData).map(([key, value]) => {
                  const fieldType = FIELD_TYPES[key] || { type: 'text' };
                  const config = RESOURCES[activeTab] as any;
                  const isRequired = config.requiredFields?.includes(key) || 
                                   (activeTab === 'Patient' && ['first_name', 'last_name', 'sex'].includes(key));
                  
                  return (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {/* Patient Dropdown */}
                      {key === 'patient' ? (
                        <select
                          value={String(value)}
                          onChange={(e) => setAddFormData({ ...addFormData, [key]: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] outline-none transition-all bg-white"
                        >
                          <option value="">Select Patient</option>
                          {patientList.map(patient => (
                            <option key={patient.name} value={patient.name}>
                              {patient.patient_name || patient.name}
                            </option>
                          ))}
                        </select>
                      )
                      
                      /* Textarea */
                      : fieldType.type === 'textarea' ? (
                        <textarea
                          value={String(value)}
                          onChange={(e) => setAddFormData({ ...addFormData, [key]: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] outline-none transition-all resize-none"
                          placeholder={fieldType.placeholder || `Enter ${key.replace(/_/g, ' ')}`}
                          rows={3}
                        />
                      )
                      
                      /* Select Dropdown */
                      : fieldType.type === 'select' && fieldType.options ? (
                        <select
                          value={String(value)}
                          onChange={(e) => setAddFormData({ ...addFormData, [key]: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] outline-none transition-all bg-white"
                        >
                          <option value="">Select {key.replace(/_/g, ' ')}</option>
                          {fieldType.options.map(opt => (
                            <option key={opt} value={opt}>
                              {opt === '0' ? 'No' : opt === '1' ? 'Yes' : opt}
                            </option>
                          ))}
                        </select>
                      )
                      
                      /* Regular Input */
                      : (
                        <input
                          type={fieldType.type}
                          value={String(value)}
                          onChange={(e) => setAddFormData({ ...addFormData, [key]: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] outline-none transition-all"
                          placeholder={fieldType.placeholder || `Enter ${key.replace(/_/g, ' ')}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                className="flex-1 bg-gradient-to-r from-[#0066CC] to-[#4A5FCC] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Create Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}