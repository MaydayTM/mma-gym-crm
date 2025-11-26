import {
  Users,
  UserPlus,
  UserMinus,
  Calendar,
  TrendingUp,
  Euro,
} from 'lucide-react'
import { StatCard } from '../components/ui'
import { useDashboardStats } from '../hooks/useDashboardStats'

export function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Fout bij laden dashboard: {(error as Error).message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welkom bij RCN CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Actieve Leden"
          value={stats?.active_members}
          icon={<Users className="w-6 h-6" />}
        />

        <StatCard
          title="Nieuwe Leden (30d)"
          value={stats?.new_members_30d}
          icon={<UserPlus className="w-6 h-6" />}
        />

        <StatCard
          title="Opzeggingen (30d)"
          value={stats?.cancellations_30d}
          icon={<UserMinus className="w-6 h-6" />}
        />

        <StatCard
          title="Check-ins (7d)"
          value={stats?.checkins_7d}
          icon={<Calendar className="w-6 h-6" />}
        />

        <StatCard
          title="Open Leads"
          value={stats?.open_leads}
          icon={<TrendingUp className="w-6 h-6" />}
        />

        <StatCard
          title="Omzet (30d)"
          value={
            stats?.revenue_30d != null
              ? `€${stats.revenue_30d.toLocaleString('nl-BE')}`
              : null
          }
          icon={<Euro className="w-6 h-6" />}
        />
      </div>
    </div>
  )
}
