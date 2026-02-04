'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { RESOURCES, ResourceKey } from '@/app/dashboard/config';
import { DashboardHeader } from '@/components/dashboard/header';
import { StatsOverview } from '@/components/dashboard/stats-cards';
import { DataView } from '@/components/dashboard/data-view';
import { DashboardModals } from '@/components/dashboard/dashboard-modals';
import { AIChatbot } from '@/components/ai-chatbot';
import { GlassDock } from "@/components/glass-dock";
import { GlassRippleButton } from "@/components/glass-ripple";
import { ChevronDown, ChevronUp, Plus, Users, Calendar, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function IOSDashboard() {
  const [mounted, setMounted] = useState(false);
  const dashboard = useDashboard();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const dockItems = (Object.keys(RESOURCES) as ResourceKey[]).map(key => ({
    id: key,
    label: RESOURCES[key].label,
    icon: RESOURCES[key].icon,
    active: dashboard.activeTab === key,
    onClick: () => { dashboard.setActiveTab(key); dashboard.setCurrentPage(1); dashboard.setSearchTerm(''); }
  }));

  return (
    <div className="min-h-screen w-full bg-background transition-colors duration-300 pb-32">
       <style jsx global>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <DashboardHeader 
        activeTab={dashboard.activeTab}
        searchTerm={dashboard.searchTerm}
        setSearchTerm={dashboard.setSearchTerm}
        showFilters={dashboard.showFilters}
        setShowFilters={dashboard.setShowFilters}
        activeFilters={dashboard.activeFilters}
        setActiveFilters={dashboard.setActiveFilters}
        viewMode={dashboard.viewMode}
        setViewMode={dashboard.setViewMode}
        data={dashboard.data}
        fetchData={dashboard.fetchData}
        loading={dashboard.loading}
      />

      <StatsOverview stats={dashboard.stats} totalRecords={dashboard.totalRecords} />

      <DataView 
        activeTab={dashboard.activeTab}
        data={dashboard.filteredAndSortedData}
        loading={dashboard.loading}
        viewMode={dashboard.viewMode}
        selectedRows={dashboard.selectedRows}
        toggleRowSelection={(index, all, rows) => {
            if (all && rows) dashboard.setSelectedRows(new Set(rows.map((_, i) => i)));
            else if (all) dashboard.setSelectedRows(new Set());
            else dashboard.toggleRowSelection(index);
        }}
        sortConfig={dashboard.sortConfig}
        handleSort={dashboard.handleSort}
        openDetail={dashboard.openDetail}
        openEdit={dashboard.openEdit}
        handleDeleteRequest={(row) => { dashboard.setSelectedRow(row); dashboard.setShowDeleteConfirm(true); }}
        handleBatchDelete={dashboard.handleBatchDelete}
        currentPage={dashboard.currentPage}
        setCurrentPage={dashboard.setCurrentPage}
        pageSize={dashboard.pageSize}
        openAdd={dashboard.openAdd}
        totalRecords={dashboard.totalRecords}
        filteredCount={dashboard.filteredAndSortedData.length}
      />

      <DashboardModals {...dashboard} handleDelete={dashboard.handleDelete} />

      {/* AI Chatbot - positioned on bottom left */}
      <AIChatbot />

      {/* Dock Navigation */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex flex-col items-center gap-3 pointer-events-none">
        <div className={cn("pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] origin-bottom", dashboard.showDock ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none")}>
          <GlassDock items={dockItems} glassIntensity="low" magnification={1.1} className="!bg-white/40 dark:!bg-slate-900/40 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-2xl" />
        </div>
        <button onClick={() => dashboard.setShowDock(!dashboard.showDock)} className="pointer-events-auto h-10 w-10 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-2 border-white/40 shadow-lg hover:scale-110 flex items-center justify-center">
          {dashboard.showDock ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {/* Floating Action Button - positioned on bottom right */}
      <div className="fixed right-6 bottom-8 z-40 pointer-events-auto">
        <div className="relative animate-float">
          {dashboard.showQuickActions && (
            <div className="absolute bottom-20 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 w-48">
              {[
                { label: 'New Patient', icon: Users, color: 'text-blue-500', action: () => { dashboard.setActiveTab('Patient'); dashboard.openAdd(); } },
                { label: 'New Appointment', icon: Calendar, color: 'text-purple-500', action: () => { dashboard.setActiveTab('Patient Appointment'); dashboard.openAdd(); } },
                { label: 'Refresh All', icon: RefreshCw, color: 'text-emerald-500', action: () => { dashboard.fetchData(); dashboard.fetchStats(); dashboard.showToast('success', 'Refreshed'); } }
              ].map((action, i) => (
                <GlassRippleButton key={i} onClick={() => { action.action(); dashboard.setShowQuickActions(false); }} className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-2xl px-5 py-3 shadow-2xl hover:scale-105 justify-start">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-sm font-bold whitespace-nowrap">{action.label}</span>
                </GlassRippleButton>
              ))}
            </div>
          )}
          <GlassRippleButton onClick={() => dashboard.setShowQuickActions(!dashboard.showQuickActions)} className={cn("h-16 w-16 rounded-[24px] flex items-center justify-center transition-all duration-500 p-0 bg-gradient-to-br from-blue-500/80 via-purple-500/80 to-pink-500/80 text-white shadow-2xl border border-white/40", dashboard.showQuickActions && "rotate-45 bg-red-500/80 from-red-500/80 to-orange-500/80")}>
            <Plus className={cn("h-8 w-8 transition-transform duration-300", dashboard.showQuickActions ? "rotate-90" : "rotate-0")} />
          </GlassRippleButton>
        </div>
      </div>
    </div>
  );
}