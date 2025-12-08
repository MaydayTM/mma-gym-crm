import { useState } from 'react'
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  Euro,
  ArrowRight,
  AlertTriangle,
  Heart,
} from 'lucide-react'
import { StatCard, Card, Modal } from '../components/ui'
import { NewMemberForm } from '../components/members/NewMemberForm'
import { useDashboardStats, useRetentionStats } from '../hooks/useDashboardStats'

export function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats()
  const { data: retentionStats } = useRetentionStats()
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-white/5 rounded-xl w-48 animate-pulse" />
          <div className="h-12 bg-white/5 rounded-full w-36 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6">
          <p className="text-rose-300 text-[14px]">
            Fout bij laden dashboard: {(error as Error).message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Dashboard</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Welkom terug, Mehdi</p>
        </div>
        <button
          onClick={() => setIsNewMemberModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
        >
          <UserPlus size={18} strokeWidth={1.5} />
          <span>Nieuw Lid</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Actieve Leden"
          value={stats?.active_members ?? 0}
          trend="+5% vs vorige maand"
          trendDirection="up"
          icon={Users}
          variant="success"
        />

        <StatCard
          label="Nieuwe Leden"
          value={stats?.new_members_30d ?? 0}
          trend="+20% vs vorige maand"
          trendDirection="up"
          icon={UserPlus}
        />

        <StatCard
          label="Check-ins (7d)"
          value={stats?.checkins_7d ?? 0}
          trend="-3% vs vorige week"
          trendDirection="down"
          icon={Calendar}
        />

        <StatCard
          label="Omzet (30d)"
          value={stats?.revenue_30d != null ? `€${stats.revenue_30d.toLocaleString('nl-BE')}` : '€0'}
          trend="+15% vs vorige maand"
          trendDirection="up"
          icon={Euro}
        />
      </div>

      {/* Retention Overview */}
      {retentionStats && (
        <Card variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Heart className="text-amber-300" size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[18px] font-medium text-neutral-50">Retentie Overzicht</h3>
              <p className="text-[12px] text-neutral-500">Gebaseerd op laatste check-in</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-center">
              <p className="text-[24px] font-bold text-emerald-300">{retentionStats.healthy}</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">Gezond</p>
              <p className="text-[10px] text-neutral-500">&lt;7 dagen</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-center">
              <p className="text-[24px] font-bold text-amber-300">{retentionStats.at_risk}</p>
              <p className="text-[11px] text-amber-300/70 mt-1">At Risk</p>
              <p className="text-[10px] text-neutral-500">7-14 dagen</p>
            </div>
            <div className="p-3 bg-orange-500/10 border border-orange-500/40 rounded-xl text-center">
              <p className="text-[24px] font-bold text-orange-300">{retentionStats.critical}</p>
              <p className="text-[11px] text-orange-300/70 mt-1">Kritiek</p>
              <p className="text-[10px] text-neutral-500">14-30 dagen</p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-center">
              <p className="text-[24px] font-bold text-rose-300">{retentionStats.churned}</p>
              <p className="text-[11px] text-rose-300/70 mt-1">Churned</p>
              <p className="text-[10px] text-neutral-500">&gt;30 dagen</p>
            </div>
            <div className="p-3 bg-neutral-500/10 border border-neutral-500/40 rounded-xl text-center">
              <p className="text-[24px] font-bold text-neutral-300">{retentionStats.never_visited}</p>
              <p className="text-[11px] text-neutral-300/70 mt-1">Nooit</p>
              <p className="text-[10px] text-neutral-500">Geen check-in</p>
            </div>
          </div>
          {(retentionStats.at_risk > 0 || retentionStats.critical > 0) && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center gap-3">
              <AlertTriangle className="text-amber-300 shrink-0" size={18} strokeWidth={1.5} />
              <p className="text-[13px] text-amber-300/90">
                {retentionStats.at_risk + retentionStats.critical} leden hebben aandacht nodig - neem contact op!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <Card variant="elevated">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-medium text-neutral-50">Recente Check-ins</h3>
            <button className="text-neutral-400 hover:text-neutral-50 transition-colors text-[13px] flex items-center gap-1">
              Alles zien <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Sarah Verhulst', time: '2 min geleden', type: 'BJJ', status: 'active' },
              { name: 'Tom Peeters', time: '15 min geleden', type: 'MMA', status: 'active' },
              { name: 'Lisa De Vries', time: '42 min geleden', type: 'Kickboxing', status: 'active' },
              { name: 'Karim Ben Ali', time: '1u geleden', type: 'BJJ', status: 'warning' },
              { name: 'Mark Jansen', time: '2u geleden', type: 'MMA', status: 'active' },
            ].map((checkin, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-3.5 py-3 hover:border-amber-300/70 hover:bg-neutral-900 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex text-[11px] font-medium text-neutral-200 bg-neutral-800 w-9 h-9 rounded-2xl items-center justify-center">
                    {checkin.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-50 tracking-tight">{checkin.name}</p>
                    <p className="text-[11px] text-neutral-400">{checkin.type} • {checkin.time}</p>
                  </div>
                </div>
                <span className={`h-1.5 w-1.5 rounded-full ${checkin.status === 'active' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]' : 'bg-amber-300'}`} />
              </div>
            ))}
          </div>
        </Card>

        {/* Open Leads */}
        <Card variant="elevated">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-medium text-neutral-50">Open Leads</h3>
            <button className="text-neutral-400 hover:text-neutral-50 transition-colors text-[13px] flex items-center gap-1">
              Alles zien <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Kevin Smeets', source: 'Instagram', status: 'Nieuw', date: 'Vandaag' },
              { name: 'Emma Wouters', source: 'Website', status: 'Contact', date: 'Gisteren' },
              { name: 'Lucas Dubois', source: 'Walk-in', status: 'Proefles', date: '2 dagen' },
              { name: 'Sophie Maes', source: 'Referral', status: 'Nieuw', date: '2 dagen' },
              { name: 'David Jacobs', source: 'Facebook', status: 'Contact', date: '3 dagen' },
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-3.5 py-3 hover:border-amber-300/70 hover:bg-neutral-900 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex text-[11px] font-medium text-amber-300 bg-amber-500/10 w-9 h-9 rounded-2xl items-center justify-center">
                    <TrendingUp size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-50 tracking-tight">{lead.name}</p>
                    <p className="text-[11px] text-neutral-400">{lead.source} • {lead.date}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ${
                  lead.status === 'Nieuw'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                    : lead.status === 'Contact'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                    : 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                }`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* New Member Modal */}
      <Modal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        title="Nieuw Lid Toevoegen"
        size="lg"
      >
        <NewMemberForm
          onSuccess={() => setIsNewMemberModalOpen(false)}
          onCancel={() => setIsNewMemberModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
