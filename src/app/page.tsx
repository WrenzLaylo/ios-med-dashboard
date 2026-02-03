'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from "next-themes";
import {
  Search, Filter, ChevronRight, LayoutList, Calendar, Users,
  Activity, RefreshCw, Plus, ArrowUp, ArrowDown, ArrowUpDown,
  Edit, Trash2, ChevronLeft, Moon, Sun, ChevronDown, ChevronUp, MoreHorizontal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Ein UI Imports ---
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { GlassMorphCard } from "@/components/glass-morph-card";
import { GlassRippleButton, GlassRipple } from "@/components/glass-ripple";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogFooter } from "@/components/ui/glass-dialog";
import { GlassDock } from "@/components/glass-dock";
import { GlassSkeleton } from "@/components/glass-skeleton";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Custom Hook: Hide Header on Scroll ---
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > prevScrollY && currentScrollY > 50) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      setPrevScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollY]);

  return scrollDirection;
}

// --- Configuration ---
const RESOURCES = {
  Patient: {
    label: 'Patients',
    columns: ['patient_name', 'mobile', 'email'],
    fields: JSON.stringify(["name", "patient_name", "first_name", "last_name", "sex", "mobile", "email", "user_id", "age_html"]),
    filterableFields: ['sex', 'email'],
    updateFields: ['first_name', 'last_name', 'sex', 'mobile', 'email'],
    createFields: ['first_name', 'last_name', 'sex', 'mobile', 'email', 'user_id', 'age'],
    fieldMapping: { age: 'age_html' },
    icon: <Users className="h-5 w-5" />,
    color: "from-cyan-500 to-blue-500"
  },
  'Patient Appointment': {
    label: 'Appointments',
    fields: JSON.stringify(["name", "patient", "patient_name", "appointment_type", "appointment_date", "appointment_time", "status", "duration", "company", "department"]),
    columns: ['name', 'patient_name', 'appointment_date', 'appointment_time', 'status'],
    filterableFields: ['status', 'appointment_type', 'appointment_date'],
    createFields: ['company', 'appointment_date', 'appointment_type', 'patient', 'duration', 'appointment_time', 'notes'],
    requiredFields: ['company', 'appointment_date', 'appointment_type', 'patient', 'duration', 'appointment_time'],
    icon: <Calendar className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500"
  },
  'Healthcare Practitioner': {
    label: 'Practitioners',
    fields: JSON.stringify(["first_name", "status", "mobile_phone", "name"]),
    columns: ['first_name', 'status', 'mobile_phone', 'name'],
    filterableFields: ['status'],
    icon: <Activity className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500"
  },
  'Practitioner Schedule': {
    label: 'Schedules',
    fields: JSON.stringify(["name", "docstatus", "schedule_name"]),
    columns: ['name', 'docstatus', 'schedule_name'],
    filterableFields: ['docstatus'],
    icon: <LayoutList className="h-5 w-5" />,
    color: "from-orange-500 to-amber-500"
  }
};

type ResourceKey = keyof typeof RESOURCES;
type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

// Field Types
const FIELD_TYPES: Record<string, { type: string; options?: string[]; placeholder?: string; default?: any }> = {
  sex: { type: 'select', options: ['Male', 'Female'] },
  email: { type: 'email', placeholder: 'email@example.com' },
  mobile: { type: 'tel', placeholder: '09XX XXX XXXX' },
  age: { type: 'number', placeholder: 'Age' },
  first_name: { type: 'text', placeholder: 'First Name' },
  last_name: { type: 'text', placeholder: 'Last Name' },
  status: { type: 'select', options: ['Active', 'Inactive', 'Disabled'] },
  docstatus: { type: 'select', options: ['0', '1', '2'] },
  appointment_date: { type: 'date' },
  appointment_time: { type: 'time' },
  company: { type: 'text', default: 'ebizolution' },
  duration: { type: 'number', default: '30' },
  notes: { type: 'textarea', placeholder: 'Notes...' },
};

export default function IOSDashboard() {
  const { theme, setTheme } = useTheme();
  const scrollDirection = useScrollDirection();

  // --- States ---
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ResourceKey>('Patient');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDock, setShowDock] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 50;

  // Stats
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activePractitioners: 0,
    pendingSchedules: 0
  });

  // --- Fix hydration issue ---
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Responsive View Mode ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Debounced search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Toast auto-dismiss ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- Data Fetching ---
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

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [activeTab, currentPage]);

  async function fetchStats() {
    try {
      const patientsRes = await fetch(`/api/proxy?${new URLSearchParams({
        resource: 'Patient',
        fields: JSON.stringify(["name"]),
        limit_start: '0',
        limit_page_length: '999999'
      })}`);
      const patientsData = await patientsRes.json();

      const appointmentsRes = await fetch(`/api/proxy?${new URLSearchParams({
        resource: 'Patient Appointment',
        fields: JSON.stringify(["name", "appointment_date", "status"]),
        limit_start: '0',
        limit_page_length: '999999'
      })}`);
      const appointmentsData = await appointmentsRes.json();

      const practitionersRes = await fetch(`/api/proxy?${new URLSearchParams({
        resource: 'Healthcare Practitioner',
        fields: JSON.stringify(["name", "status"]),
        limit_start: '0',
        limit_page_length: '999999'
      })}`);
      const practitionersData = await practitionersRes.json();

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsData.data?.filter((a: any) => a.appointment_date === today).length || 0;
      const activePracts = practitionersData.data?.filter((p: any) => p.status === 'Active').length || 0;

      setStats({
        totalPatients: patientsData.data?.length || 0,
        todayAppointments: todayAppts,
        activePractitioners: activePracts,
        pendingSchedules: 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const config = RESOURCES[activeTab];
      const countParams = new URLSearchParams({
        resource: activeTab,
        fields: JSON.stringify(["name"]),
        limit_start: '0',
        limit_page_length: '999999'
      });
      const countRes = await fetch(`/api/proxy?${countParams}`);
      const countResult = await countRes.json();
      setTotalRecords(countResult.data?.length || 0);

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

  // --- Filter Logic ---
  const filteredAndSortedData = useMemo(() => {
    let result = data;
    if (debouncedSearchTerm) {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(lowerTerm))
      );
    }
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value) result = result.filter(item => item[field] === value);
    });
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === bVal) return 0;
        return sortConfig.direction === 'asc'
          ? (aVal < bVal ? -1 : 1)
          : (aVal < bVal ? 1 : -1);
      });
    }
    return result;
  }, [data, debouncedSearchTerm, activeFilters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current =>
      (current?.key === key && current.direction === 'asc')
        ? { key, direction: 'desc' }
        : { key, direction: 'asc' }
    );
  };

  // --- Actions ---
  const openDetail = (row: any) => {
    setSelectedRow(row);
    setIsDetailOpen(true);
  };

  const openEdit = (row: any) => {
    const config = RESOURCES[activeTab];
    const fieldsToEdit = (config as any).updateFields || (config as any).createFields || config.columns;
    const initialData: any = { name: row.name };
    fieldsToEdit.forEach((field: string) => {
        if (row[field] !== undefined) {
            initialData[field] = row[field];
        } else {
            const fieldDef = FIELD_TYPES[field];
            initialData[field] = fieldDef?.default !== undefined ? fieldDef.default : '';
        }
    });

    setEditFormData(initialData);
    setIsEditOpen(true);
    setIsDetailOpen(false);
  };

  const openAdd = () => {
    const config = RESOURCES[activeTab];
    const emptyForm: any = {};
    const fields = (config as any).createFields || config.columns;
    fields.forEach((col: string) => {
      const fieldDef = FIELD_TYPES[col];
      emptyForm[col] = fieldDef?.default !== undefined ? fieldDef.default : '';
    });
    setAddFormData(emptyForm);
    setIsAddOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRow || !selectedRow.name) {
      showToast('error', 'No record selected or record ID is missing');
      return;
    }
    setShowDeleteConfirm(false);
    try {
      showToast('info', 'Deleting record...');
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: activeTab, name: selectedRow.name })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete record');
      showToast('success', 'Record deleted successfully!');
      setIsDetailOpen(false);
      setSelectedRow(null);
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to delete record');
    }
  };

  const handleSave = async () => {
    const isCreating = isAddOpen;
    const currentData = isCreating ? addFormData : editFormData;

    if (!currentData || Object.keys(currentData).length === 0) {
      showToast('error', 'Please fill in the form fields');
      return;
    }

    let payloadData = { ...currentData };
    if (!isCreating) {
      const systemFields = ['creation', 'modified', 'owner', 'docstatus', 'idx', '_user_tags', '_comments', '_assign', '_liked_by'];
      systemFields.forEach(field => delete payloadData[field]);
    }

    try {
      showToast('info', isCreating ? 'Creating record...' : 'Updating record...');
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: activeTab,
          action: isCreating ? 'create' : 'update',
          data: payloadData,
          name: isCreating ? undefined : currentData.name
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save changes');
      setIsAddOpen(false);
      setIsEditOpen(false);
      setAddFormData({});
      setEditFormData({});
      showToast('success', isCreating ? 'Record created successfully!' : 'Record updated successfully!');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Save error:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastMessage({ type, message });
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedRows(newSelection);
  };

  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) return;
    try {
      showToast('info', `Deleting ${selectedRows.size} records...`);
      const deletePromises = Array.from(selectedRows).map(async (index) => {
        const row = filteredAndSortedData[index];
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: activeTab, name: row.name })
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || 'Failed to delete record');
        }
      });
      await Promise.all(deletePromises);
      showToast('success', `${selectedRows.size} records deleted successfully!`);
      setSelectedRows(new Set());
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Batch delete error:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to delete some records');
    }
  };

  const dockItems = (Object.keys(RESOURCES) as ResourceKey[]).map(key => ({
    id: key,
    label: RESOURCES[key].label,
    icon: RESOURCES[key].icon,
    active: activeTab === key,
    onClick: () => {
      setActiveTab(key);
      setCurrentPage(1);
      setSearchTerm('');
    }
  }));

  const getStatusVariant = (status: any) => {
    if (['Active', 'Open', 1].includes(status)) return 'success';
    if (['Closed', 0].includes(status)) return 'outline';
    return 'default';
  };

  return (
    <div className="min-h-screen w-full bg-background transition-colors duration-300 pb-32">
       <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

      {/* --- Sticky Header --- */}
      <header
        className={cn(
          "sticky top-0 z-40 px-6 py-5 transition-transform duration-300 ease-in-out",
          "bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl",
          "border-b border-gray-200/30 dark:border-white/5",
          "shadow-xl shadow-black/5 dark:shadow-black/30",
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent dark:before:from-white/5 dark:before:to-transparent before:pointer-events-none",
          scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-sm",
              "bg-gradient-to-br shadow-2xl",
              "border-2 border-white/30 dark:border-white/10",
              RESOURCES[activeTab].color,
              "relative overflow-hidden group",
              "hover:scale-105 transition-all duration-500"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
              <Activity className="h-7 w-7 text-white relative z-10 drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent drop-shadow-sm">
                Health OS
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider">
                Advanced Healthcare Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button - Now with Ripple */}
            <GlassRippleButton
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-foreground"
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
              ) : <div className="h-5 w-5" />}
            </GlassRippleButton>
          </div>
        </div>

        {/* Toolbar */}
        <div className="max-w-7xl mx-auto flex gap-3 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400 z-10 drop-shadow-sm" />
            <input
              type="text"
              placeholder={`Search ${RESOURCES[activeTab].label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full h-11 pl-11 pr-4 rounded-2xl transition-all duration-500",
                "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl",
                "border-2 border-white/40 dark:border-white/10",
                "focus:bg-white/90 dark:focus:bg-slate-800/90",
                "focus:border-primary/50 focus:shadow-2xl focus:scale-[1.02]",
                "text-gray-900 dark:text-foreground text-sm",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "shadow-lg hover:shadow-xl",
                "outline-none"
              )}
            />
          </div>

          {[
            { icon: Filter, active: showFilters, onClick: () => setShowFilters(!showFilters) },
            { icon: RefreshCw, active: false, onClick: () => fetchData(), spinning: loading },
            { icon: LayoutList, active: false, onClick: () => setViewMode(v => v === 'table' ? 'card' : 'table') }
          ].map((btn, idx) => (
            // Replaced manual button with GlassRippleButton
            <GlassRippleButton
              key={idx}
              onClick={btn.onClick}
              className={cn(
                "h-11 w-11 rounded-2xl flex items-center justify-center p-0",
                "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl",
                "border-2 border-white/40 dark:border-white/10",
                "text-gray-800 dark:text-foreground",
                btn.active && "bg-primary/30 dark:bg-primary/30 border-primary/50 text-primary"
              )}
            >
              <btn.icon className={cn("h-4 w-4", btn.spinning && "animate-spin")} />
            </GlassRippleButton>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="max-w-7xl mx-auto mt-4 animate-in slide-in-from-top-2">
            <GlassCard className="bg-accent/30 dark:bg-accent/20 border-border/70">
              <GlassCardContent className="p-4 flex flex-wrap gap-4">
                {RESOURCES[activeTab].filterableFields.map(field => {
                  const uniqueValues = [...new Set(data.map(i => i[field]).filter(Boolean))];
                  return (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-muted-foreground">{field.replace(/_/g, ' ')}</label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueValues.map((val: any) => (
                          <GlassBadge
                            key={val}
                            variant={activeFilters[field] === val ? 'default' : 'outline'}
                            className="cursor-pointer hover:scale-105 transition-transform border-gray-300 dark:border-border/50 text-gray-900 dark:text-foreground"
                            onClick={() => setActiveFilters(prev => ({ ...prev, [field]: prev[field] === val ? '' : val }))}
                          >
                            {val}
                          </GlassBadge>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {Object.keys(activeFilters).length > 0 && (
                  <GlassButton size="sm" variant="ghost" onClick={() => setActiveFilters({})} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    Clear Filters
                  </GlassButton>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        )}
      </header>

      {/* --- Stats Dashboard (Morph Cards) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassMorphCard glowColor="cyan" intensity={30}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">{stats.totalPatients.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </GlassMorphCard>
          
          <GlassMorphCard glowColor="purple" intensity={30}>
             <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">{stats.todayAppointments}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </GlassMorphCard>

          <GlassMorphCard glowColor="green" intensity={30}>
             <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Active Practitioners</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">{stats.activePractitioners}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </GlassMorphCard>

          <GlassMorphCard glowColor="blue" intensity={30}>
             <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Schedules</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">{totalRecords.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <LayoutList className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </GlassMorphCard>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <GlassCard className="overflow-hidden min-h-[600px] border-border/70 shadow-lg bg-card/80 dark:bg-card/50">
          <GlassCardHeader className="border-b border-border/70 bg-accent/10 dark:bg-accent/5 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <GlassCardTitle className="text-gray-900 dark:text-foreground/90">{RESOURCES[activeTab].label}</GlassCardTitle>
                <GlassCardDescription className="text-gray-600 dark:text-muted-foreground/80">
                  {selectedRows.size > 0 ? (
                    <span className="flex items-center gap-2">
                      {selectedRows.size} selected
                      <button onClick={handleBatchDelete} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                        Delete selected
                      </button>
                    </span>
                  ) : (
                    `${filteredAndSortedData.length} Records`
                  )}
                </GlassCardDescription>
              </div>
              <div className="flex items-center gap-1 bg-white/60 dark:bg-accent/30 rounded-lg p-1 border border-gray-200 dark:border-border/50">
                {/* Pagination Controls - Updated to GlassRippleButton */}
                <GlassRippleButton
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 h-8 w-8 hover:bg-gray-200 dark:hover:bg-accent/60 rounded-md disabled:opacity-30 text-gray-800 dark:text-foreground flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </GlassRippleButton>
                <span className="text-xs font-mono px-2 text-gray-900 dark:text-foreground/80">{currentPage}</span>
                <GlassRippleButton
                  disabled={data.length < pageSize}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 h-8 w-8 hover:bg-gray-200 dark:hover:bg-accent/60 rounded-md disabled:opacity-30 text-gray-800 dark:text-foreground flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" />
                </GlassRippleButton>
              </div>
            </div>
          </GlassCardHeader>

          <GlassCardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                <GlassSkeleton className="h-12 w-full rounded-xl" />
                <GlassSkeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground p-8">
                {/* Empty State */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                  <Search className="h-24 w-24 opacity-20 relative z-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
                  {searchTerm || Object.keys(activeFilters).length > 0 ? 'No results found' : `No ${RESOURCES[activeTab].label.toLowerCase()} yet`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6 text-center max-w-md">
                  {searchTerm || Object.keys(activeFilters).length > 0
                    ? 'Try adjusting your search or filters.'
                    : `Get started by adding your first ${RESOURCES[activeTab].label.toLowerCase().slice(0, -1)}.`
                  }
                </p>
                {!searchTerm && Object.keys(activeFilters).length === 0 && (
                  <GlassRippleButton onClick={openAdd} className="gap-2 bg-primary text-white">
                    <Plus className="h-4 w-4" />
                    Add {RESOURCES[activeTab].label.slice(0, -1)}
                  </GlassRippleButton>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-gray-700 dark:text-muted-foreground uppercase bg-gray-100 dark:bg-accent/10 border-b border-gray-300 dark:border-border">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRows(new Set(filteredAndSortedData.map((_, i) => i)));
                            else setSelectedRows(new Set());
                          }}
                          className="h-4 w-4 rounded border-gray-300 dark:border-border text-primary focus:ring-2 focus:ring-primary/50"
                        />
                      </th>
                      {RESOURCES[activeTab].columns.map(col => (
                        <th
                          key={col}
                          className={cn(
                            "px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors whitespace-nowrap",
                            (col === 'mobile' || col === 'email' || col === 'status') && "hidden md:table-cell"
                          )}
                          onClick={() => handleSort(col)}
                        >
                          <div className="flex items-center gap-1">
                            {col.replace(/_/g, ' ')}
                            {sortConfig?.key === col ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAndSortedData.map((row, i) => (
                      <tr key={i} className={cn(
                        "hover:bg-accent/50 dark:hover:bg-accent/40 transition-colors group cursor-pointer",
                        selectedRows.has(i) && "bg-primary/10 dark:bg-primary/10"
                      )}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(i)}
                            onChange={(e) => { e.stopPropagation(); toggleRowSelection(i); }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 dark:border-border text-primary focus:ring-2 focus:ring-primary/50"
                          />
                        </td>
                        {RESOURCES[activeTab].columns.map(col => (
                          <td 
                            key={`${i}-${col}`} 
                            className={cn(
                              "px-4 py-3 text-foreground whitespace-nowrap",
                              (col === 'mobile' || col === 'email' || col === 'status') && "hidden md:table-cell"
                            )}
                            onClick={() => openDetail(row)}
                          >
                            {(col === 'status' || col === 'docstatus') ? (
                              <GlassBadge variant={getStatusVariant(row[col])} className="text-gray-900 dark:text-foreground">
                                {row[col] === 1 ? 'Submitted' : row[col] === 0 ? 'Draft' : row[col]}
                              </GlassBadge>
                            ) : (
                              <span className="text-gray-900 dark:text-foreground/90">{row[col]}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                              className="p-1.5 hover:bg-primary/10 rounded-full text-gray-500 hover:text-primary transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedRow(row); setShowDeleteConfirm(true); }}
                              className="p-1.5 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => openDetail(row)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-accent rounded-full text-gray-400">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {/* --- Ripple Container Example for Grid Cards --- */}
                {filteredAndSortedData.map((row, i) => (
                  <GlassRipple 
                    key={i} 
                    className="rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => openDetail(row)}
                    color="cyan" // Subtle feedback color
                  >
                    <GlassCard
                      className="h-full hover:bg-accent/50 dark:hover:bg-accent/30 transition-all duration-300 border-border/70 pointer-events-none" // pointer-events-none to let ripple capture click if needed, or just let bubble
                    >
                      <GlassCardContent className="p-4 space-y-2 pointer-events-auto">
                        <div className="flex justify-between items-start">
                            <div className="font-bold">{row.name}</div>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="text-primary z-10 relative"><Edit className="h-4 w-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); setSelectedRow(row); setShowDeleteConfirm(true); }} className="text-red-500 z-10 relative"><Trash2 className="h-4 w-4"/></button>
                            </div>
                        </div>
                        {RESOURCES[activeTab].columns.map(col => (
                          <div key={col} className="flex justify-between items-start border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-[11px] font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-wide">{col.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium text-right text-gray-900 dark:text-foreground/90 truncate max-w-[60%]">{row[col]}</span>
                          </div>
                        ))}
                      </GlassCardContent>
                    </GlassCard>
                  </GlassRipple>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </main>

      {/* --- Dock Navigation --- */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex flex-col items-center gap-3 pointer-events-none">
        <div className={cn(
          "pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] origin-bottom",
          showDock ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}>
          <GlassDock
            items={dockItems}
            glassIntensity="low"
            magnification={1.1}
            className="!bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-2xl"
          />
        </div>

        <button
          onClick={() => setShowDock(!showDock)}
          className={cn(
            "pointer-events-auto h-10 w-10 rounded-full transition-all duration-500 flex items-center justify-center",
            "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl",
            "border-2 border-white/40 dark:border-white/10",
            "hover:bg-white/90 dark:hover:bg-slate-800/90",
            "text-gray-800 dark:text-foreground",
            "shadow-lg hover:shadow-2xl hover:scale-110 hover:border-white/60 dark:hover:border-white/20",
            "group relative overflow-hidden"
          )}
        >
          {showDock ? 
            <ChevronDown className="h-5 w-5 relative z-10 drop-shadow" /> : 
            <ChevronUp className="h-5 w-5 relative z-10 drop-shadow" />
          }
        </button>
      </div>

      {/* --- Detail Modal --- */}
      <GlassDialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <GlassDialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <GlassDialogHeader>
            <GlassDialogTitle className="text-gray-900 dark:text-foreground">{RESOURCES[activeTab].label} Details</GlassDialogTitle>
            <GlassDialogDescription className="text-gray-600 dark:text-muted-foreground">View and manage record information</GlassDialogDescription>
          </GlassDialogHeader>
          <div className="flex gap-2 border-b border-border/50 px-1 flex-shrink-0">
            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary">Information</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground">History</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground">Notes</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 glass-scrollbar min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRow && Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="bg-gray-50 dark:bg-accent/20 p-4 rounded-lg border border-gray-200 dark:border-border hover:shadow-md transition-shadow">
                  <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase block mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    {key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground break-words">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
          <GlassDialogFooter className="mt-4 gap-2 flex-shrink-0 z-10 bg-white/50 dark:bg-black/20 backdrop-blur-md p-2 rounded-xl">
            {/* Swapped to GlassRippleButton */}
            <GlassRippleButton 
              className="bg-red-500/80 hover:bg-red-600/90 text-white" 
              onClick={() => { setIsDetailOpen(false); setShowDeleteConfirm(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </GlassRippleButton>
            <GlassRippleButton onClick={() => openEdit(selectedRow)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>

      {/* --- Add/Edit Modal --- */}
      <GlassDialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <GlassDialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <GlassDialogHeader>
            <GlassDialogTitle>{isAddOpen ? 'Create New' : 'Edit'} {RESOURCES[activeTab].label}</GlassDialogTitle>
          </GlassDialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 py-4 glass-scrollbar max-h-[calc(90vh-180px)]">
            <div className="space-y-4">
              {Object.entries(isAddOpen ? addFormData : editFormData).map(([key, value]) => {
                const fieldType = FIELD_TYPES[key] || { type: 'text' };
                if (key === 'name' && !isAddOpen) return null; 
                return (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}</label>
                    {fieldType.type === 'textarea' ? (
                      <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 ring-primary/50 outline-none resize-y" value={String(value)} onChange={(e) => { const newData = isAddOpen ? { ...addFormData } : { ...editFormData }; newData[key] = e.target.value; isAddOpen ? setAddFormData(newData) : setEditFormData(newData); }} placeholder={fieldType.placeholder} />
                    ) : key === 'patient' && activeTab === 'Patient Appointment' ? (
                      <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 ring-primary/50 outline-none" value={String(value)} onChange={(e) => isAddOpen ? setAddFormData({ ...addFormData, [key]: e.target.value }) : setEditFormData({ ...editFormData, [key]: e.target.value })}> <option value="">Select Patient</option> {patientList.map(p => <option key={p.name} value={p.name}>{p.patient_name}</option>)} </select>
                    ) : fieldType.type === 'select' ? (
                      <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 ring-primary/50 outline-none" value={String(value)} onChange={(e) => { const newData = isAddOpen ? { ...addFormData } : { ...editFormData }; newData[key] = e.target.value; isAddOpen ? setAddFormData(newData) : setEditFormData(newData); }}> <option value="">Select {key.replace(/_/g, ' ')}</option> {fieldType.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select>
                    ) : (
                      <GlassInput type={fieldType.type} value={String(value)} onChange={(e) => { const newData = isAddOpen ? { ...addFormData } : { ...editFormData }; newData[key] = e.target.value; isAddOpen ? setAddFormData(newData) : setEditFormData(newData); }} placeholder={fieldType.placeholder} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <GlassDialogFooter className="mt-4 pt-4 border-t border-border/50">
            {/* Swapped to GlassRippleButton */}
            <GlassRippleButton variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</GlassRippleButton>
            <GlassRippleButton onClick={handleSave}>Save Changes</GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>

      {/* --- Quick Actions Floating Button --- */}
      <div className="fixed right-6 bottom-8 z-40">
        <div className="relative animate-float"> 
          {/* Quick actions menu */}
          {showQuickActions && (
            <div className="absolute bottom-20 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
               {/* Updated Quick Action Buttons to use GlassRippleButton */}
              <GlassRippleButton
                onClick={() => { setActiveTab('Patient'); setShowQuickActions(false); openAdd(); }}
                className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-2xl px-5 py-3 shadow-2xl hover:scale-105 transition-transform text-gray-900 dark:text-foreground group w-full justify-start"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-bold whitespace-nowrap">New Patient</span>
              </GlassRippleButton>
              <GlassRippleButton
                onClick={() => { setActiveTab('Patient Appointment'); setShowQuickActions(false); openAdd(); }}
                className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-2xl px-5 py-3 shadow-2xl hover:scale-105 transition-transform text-gray-900 dark:text-foreground group w-full justify-start"
              >
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-bold whitespace-nowrap">New Appointment</span>
              </GlassRippleButton>
              <GlassRippleButton
                onClick={() => { fetchData(); fetchStats(); setShowQuickActions(false); showToast('success', 'Data refreshed!'); }}
                className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-2xl px-5 py-3 shadow-2xl hover:scale-105 transition-transform text-gray-900 dark:text-foreground group w-full justify-start"
              >
                <RefreshCw className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold whitespace-nowrap">Refresh All</span>
              </GlassRippleButton>
            </div>
          )}

          {/* Main FAB - Using GlassRippleButton but keeping liquid style via classes */}
          <GlassRippleButton
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              "h-16 w-16 rounded-[24px] flex items-center justify-center transition-all duration-500 p-0",
              "bg-gradient-to-br from-blue-500/80 via-purple-500/80 to-pink-500/80",
              "backdrop-blur-2xl border border-white/40",
              "shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
              "hover:scale-110 hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.5)]",
              "text-white overflow-hidden",
              showQuickActions && "rotate-45 bg-red-500/80 from-red-500/80 to-orange-500/80"
            )}
          >
             {/* Note: GlassRippleButton inherently adds ripple, providing the requested feedback */}
            <Plus className={cn("h-8 w-8 relative z-10 drop-shadow-md transition-transform duration-300", showQuickActions ? "rotate-90" : "rotate-0")} />
          </GlassRippleButton>
        </div>
      </div>

      {/* --- Delete Confirmation Dialog --- */}
      <GlassDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <GlassDialogContent className="max-w-md">
          <GlassDialogHeader>
            <GlassDialogTitle className="text-gray-900 dark:text-foreground">Confirm Deletion</GlassDialogTitle>
            <GlassDialogDescription className="text-gray-600 dark:text-muted-foreground">Are you sure you want to delete this record? This action cannot be undone.</GlassDialogDescription>
          </GlassDialogHeader>
          <GlassDialogFooter className="gap-2">
            <GlassRippleButton variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</GlassRippleButton>
            <GlassRippleButton className="bg-red-500/80 hover:bg-red-600/90 text-white" onClick={handleDelete}>Delete</GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>

    </div>
  );
}