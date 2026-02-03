import { Search, Filter, RefreshCw, LayoutList, Activity, Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils"; // Assuming you have this standard util
import { GlassRippleButton } from "@/components/glass-ripple";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassButton } from "@/components/ui/glass-button";
import { RESOURCES, ResourceKey } from '@/app/dashboard/config';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface HeaderProps {
  activeTab: ResourceKey;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFilters: Record<string, string>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  viewMode: 'table' | 'card';
  setViewMode: (mode: 'table' | 'card') => void;
  data: any[];
  fetchData: () => void;
  loading: boolean;
}

export function DashboardHeader({ 
  activeTab, searchTerm, setSearchTerm, showFilters, setShowFilters, 
  activeFilters, setActiveFilters, viewMode, setViewMode, data, fetchData, loading 
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const scrollDirection = useScrollDirection();
  const resource = RESOURCES[activeTab];

  return (
    <header className={cn(
      "sticky top-0 z-40 px-6 py-5 transition-transform duration-300 ease-in-out",
      "bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-gray-200/30 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/30",
      scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-sm bg-gradient-to-br shadow-2xl border-2 border-white/30 dark:border-white/10 relative overflow-hidden group hover:scale-105 transition-all duration-500", resource.color)}>
            <Activity className="h-7 w-7 text-white relative z-10 drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent drop-shadow-sm">Health OS</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider">Advanced Healthcare Dashboard</p>
          </div>
        </div>
        <GlassRippleButton onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-foreground">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </GlassRippleButton>
      </div>

      <div className="max-w-7xl mx-auto flex gap-3 relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400 z-10 drop-shadow-sm" />
          <input
            type="text"
            placeholder={`Search ${resource.label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-2xl transition-all duration-500 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-2 border-white/40 dark:border-white/10 focus:bg-white/90 dark:focus:bg-slate-800/90 focus:border-primary/50 focus:shadow-2xl focus:scale-[1.02] text-gray-900 dark:text-foreground text-sm outline-none shadow-lg hover:shadow-xl"
          />
        </div>
        {[
          { icon: Filter, active: showFilters, onClick: () => setShowFilters(!showFilters) },
          { icon: RefreshCw, active: false, onClick: () => fetchData(), spinning: loading },
          { icon: LayoutList, active: false, onClick: () => setViewMode(viewMode === 'table' ? 'card' : 'table') }
        ].map((btn, idx) => (
          <GlassRippleButton key={idx} onClick={btn.onClick} className={cn("h-11 w-11 rounded-2xl flex items-center justify-center p-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-foreground", btn.active && "bg-primary/30 dark:bg-primary/30 border-primary/50 text-primary")}>
            <btn.icon className={cn("h-4 w-4", btn.spinning && "animate-spin")} />
          </GlassRippleButton>
        ))}
      </div>

      {showFilters && (
        <div className="max-w-7xl mx-auto mt-4 animate-in slide-in-from-top-2">
          <GlassCard className="bg-accent/30 dark:bg-accent/20 border-border/70">
            <GlassCardContent className="p-4 flex flex-wrap gap-4">
              {resource.filterableFields.map(field => {
                const uniqueValues = [...new Set(data.map(i => i[field]).filter(Boolean))];
                return (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-muted-foreground">{field.replace(/_/g, ' ')}</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueValues.map((val: any) => (
                        <GlassBadge key={val} variant={activeFilters[field] === val ? 'default' : 'outline'} className="cursor-pointer hover:scale-105 transition-transform border-gray-300 dark:border-border/50 text-gray-900 dark:text-foreground" onClick={() => setActiveFilters(prev => ({ ...prev, [field]: prev[field] === val ? '' : val }))}>
                          {val}
                        </GlassBadge>
                      ))}
                    </div>
                  </div>
                )
              })}
              {Object.keys(activeFilters).length > 0 && (
                <GlassButton size="sm" variant="ghost" onClick={() => setActiveFilters({})} className="text-destructive hover:text-destructive hover:bg-destructive/10">Clear Filters</GlassButton>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </header>
  );
}