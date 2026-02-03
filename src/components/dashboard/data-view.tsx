import { Edit, Trash2, ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ArrowUpDown, Plus, Search } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { GlassRippleButton, GlassRipple } from "@/components/glass-ripple";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassSkeleton } from "@/components/glass-skeleton";
import { RESOURCES, ResourceKey } from '@/app/dashboard/config';
import { cn } from "@/lib/utils";

interface DataViewProps {
  activeTab: ResourceKey;
  data: any[];
  loading: boolean;
  viewMode: 'table' | 'card';
  selectedRows: Set<number>;
  toggleRowSelection: (index: number, all?: boolean, rows?: any[]) => void; // Modified signature
  sortConfig: any;
  handleSort: (key: string) => void;
  openDetail: (row: any) => void;
  openEdit: (row: any) => void;
  handleDeleteRequest: (row: any) => void;
  handleBatchDelete: () => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  openAdd: () => void;
  totalRecords: number;
  filteredCount: number;
}

export function DataView({ 
  activeTab, data, loading, viewMode, selectedRows, toggleRowSelection, sortConfig, handleSort,
  openDetail, openEdit, handleDeleteRequest, handleBatchDelete, currentPage, setCurrentPage, 
  pageSize, openAdd, filteredCount
}: DataViewProps) {
  
  const resource = RESOURCES[activeTab];

  const getStatusVariant = (status: any) => {
    if (['Active', 'Open', 1].includes(status)) return 'success';
    if (['Closed', 0].includes(status)) return 'outline';
    return 'default';
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <GlassCard className="overflow-hidden min-h-[600px] border-border/70 shadow-lg bg-card/80 dark:bg-card/50">
        <GlassCardHeader className="border-b border-border/70 bg-accent/10 dark:bg-accent/5 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <GlassCardTitle className="text-gray-900 dark:text-foreground/90">{resource.label}</GlassCardTitle>
              <GlassCardDescription className="text-gray-600 dark:text-muted-foreground/80">
                {selectedRows.size > 0 ? (
                  <span className="flex items-center gap-2">
                    {selectedRows.size} selected
                    <button onClick={handleBatchDelete} className="text-xs text-red-600 dark:text-red-400 hover:underline">Delete selected</button>
                  </span>
                ) : `${filteredCount} Records`}
              </GlassCardDescription>
            </div>
            <div className="flex items-center gap-1 bg-white/60 dark:bg-accent/30 rounded-lg p-1 border border-gray-200 dark:border-border/50">
              <GlassRippleButton disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 h-8 w-8 flex items-center justify-center">
                <ChevronLeft className="h-4 w-4" />
              </GlassRippleButton>
              <span className="text-xs font-mono px-2 text-gray-900 dark:text-foreground/80">{currentPage}</span>
              <GlassRippleButton disabled={data.length < pageSize} onClick={() => setCurrentPage(p => p + 1)} className="p-2 h-8 w-8 flex items-center justify-center">
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
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <Search className="h-24 w-24 opacity-20 relative z-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">No results found</h3>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6 text-center max-w-md">Try adjusting filters or add a new record.</p>
              <GlassRippleButton onClick={openAdd} className="gap-2 bg-primary text-white"><Plus className="h-4 w-4" /> Add {resource.label.slice(0, -1)}</GlassRippleButton>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-gray-700 dark:text-muted-foreground uppercase bg-gray-100 dark:bg-accent/10 border-b border-gray-300 dark:border-border">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <input type="checkbox" checked={selectedRows.size === data.length && data.length > 0} onChange={(e) => toggleRowSelection(-1, true, data)} className="h-4 w-4 rounded border-gray-300 dark:border-border text-primary focus:ring-2 focus:ring-primary/50" />
                    </th>
                    {resource.columns.map(col => (
                      <th key={col} className={cn("px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors whitespace-nowrap", (col === 'mobile' || col === 'email' || col === 'status') && "hidden md:table-cell")} onClick={() => handleSort(col)}>
                        <div className="flex items-center gap-1">
                          {col.replace(/_/g, ' ')}
                          {sortConfig?.key === col ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, i) => (
                    <tr key={i} className={cn("hover:bg-accent/50 dark:hover:bg-accent/40 transition-colors group cursor-pointer", selectedRows.has(i) && "bg-primary/10 dark:bg-primary/10")}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.has(i)} onChange={(e) => { e.stopPropagation(); toggleRowSelection(i); }} onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded border-gray-300 dark:border-border text-primary focus:ring-2 focus:ring-primary/50" />
                      </td>
                      {resource.columns.map(col => (
                        <td key={`${i}-${col}`} className={cn("px-4 py-3 text-foreground whitespace-nowrap", (col === 'mobile' || col === 'email' || col === 'status') && "hidden md:table-cell")} onClick={() => openDetail(row)}>
                          {(col === 'status' || col === 'docstatus') ? (
                            <GlassBadge variant={getStatusVariant(row[col])} className="text-gray-900 dark:text-foreground">{row[col] === 1 ? 'Submitted' : row[col] === 0 ? 'Draft' : row[col]}</GlassBadge>
                          ) : <span className="text-gray-900 dark:text-foreground/90">{row[col]}</span>}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 hover:bg-primary/10 rounded-full text-gray-500 hover:text-primary transition-colors"><Edit className="h-4 w-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(row); }} className="p-1.5 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          <button onClick={() => openDetail(row)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-accent rounded-full text-gray-400"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {data.map((row, i) => (
                <GlassRipple key={i} className="rounded-xl overflow-hidden cursor-pointer" onClick={() => openDetail(row)} color="cyan">
                  <GlassCard className="h-full hover:bg-accent/50 dark:hover:bg-accent/30 transition-all duration-300 border-border/70 pointer-events-none">
                    <GlassCardContent className="p-4 space-y-2 pointer-events-auto">
                      <div className="flex justify-between items-start">
                        <div className="font-bold">{row.name}</div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="text-primary z-10 relative"><Edit className="h-4 w-4"/></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(row); }} className="text-red-500 z-10 relative"><Trash2 className="h-4 w-4"/></button>
                        </div>
                      </div>
                      {resource.columns.map(col => (
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
  );
}