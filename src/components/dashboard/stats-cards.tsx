import { Users, Calendar, Activity, LayoutList } from 'lucide-react';
import { GlassMorphCard } from "@/components/glass-morph-card";

interface StatsProps {
  stats: { totalPatients: number; todayAppointments: number; activePractitioners: number; pendingSchedules: number };
  totalRecords: number;
}

export function StatsOverview({ stats, totalRecords }: StatsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', val: stats.totalPatients, icon: Users, color: 'cyan', from: 'from-cyan-500', to: 'to-blue-500' },
          { label: "Today's Appointments", val: stats.todayAppointments, icon: Calendar, color: 'purple', from: 'from-purple-500', to: 'to-pink-500' },
          { label: 'Active Practitioners', val: stats.activePractitioners, icon: Activity, color: 'green', from: 'from-emerald-500', to: 'to-teal-500' },
          { label: 'Total Schedules', val: totalRecords, icon: LayoutList, color: 'blue', from: 'from-orange-500', to: 'to-amber-500' }
        ].map((item, i) => (
          <GlassMorphCard key={i} glowColor={item.color as any} intensity={30}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground mt-2">{item.val.toLocaleString()}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </GlassMorphCard>
        ))}
      </div>
    </div>
  );
}