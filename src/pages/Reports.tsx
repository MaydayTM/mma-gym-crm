import { useState } from 'react'
import { BarChart3, Users, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Card } from '../components/ui'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

type Period = '7d' | '30d' | '90d' | '365d'

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 dagen' },
  { value: '30d', label: '30 dagen' },
  { value: '90d', label: '90 dagen' },
  { value: '365d', label: '1 jaar' },
]

function getPeriodDays(period: Period): number {
  switch (period) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '365d': return 365
  }
}

export function Reports() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: memberStats, isLoading: loadingMembers } = useMemberStats(period)
  const { data: checkinStats, isLoading: loadingCheckins } = useCheckinStats(period)
  const { data: topDisciplines, isLoading: loadingDisciplines } = useTopDisciplines(period)

  const isLoading = loadingMembers || loadingCheckins || loadingDisciplines

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Rapportages</h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            Inzichten en statistieken over je gym
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-neutral-900 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-[13px] rounded-lg transition ${
                  period === p.value
                    ? 'bg-amber-300 text-neutral-950 font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              label="Nieuwe Leden"
              value={memberStats?.newMembers ?? 0}
              change={memberStats?.newMembersChange ?? 0}
              icon={Users}
            />
            <ReportCard
              label="Opzeggingen"
              value={memberStats?.cancellations ?? 0}
              change={memberStats?.cancellationsChange ?? 0}
              icon={Users}
              negative
            />
            <ReportCard
              label="Totale Check-ins"
              value={checkinStats?.total ?? 0}
              change={checkinStats?.change ?? 0}
              icon={Calendar}
            />
            <ReportCard
              label="Gem. Check-ins/Lid"
              value={(checkinStats?.avgPerMember ?? 0).toFixed(1)}
              change={checkinStats?.avgChange ?? 0}
              icon={BarChart3}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Disciplines */}
            <Card variant="elevated">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-medium text-neutral-50">Populaire Disciplines</h3>
                <span className="text-[12px] text-neutral-500">Afgelopen {getPeriodDays(period)} dagen</span>
              </div>
              <div className="space-y-3">
                {topDisciplines?.map((discipline, i) => (
                  <div key={discipline.name} className="flex items-center gap-3">
                    <span className="text-[14px] text-neutral-500 w-5">{i + 1}.</span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: discipline.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[14px] text-neutral-200">{discipline.name}</span>
                        <span className="text-[13px] text-neutral-400">{discipline.checkins} check-ins</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${discipline.percentage}%`,
                            backgroundColor: discipline.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!topDisciplines || topDisciplines.length === 0) && (
                  <p className="text-[14px] text-neutral-500 text-center py-4">
                    Geen check-in data beschikbaar
                  </p>
                )}
              </div>
            </Card>

            {/* Member Growth */}
            <Card variant="elevated">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-medium text-neutral-50">Ledenoverzicht</h3>
                <span className="text-[12px] text-neutral-500">Huidige stand</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-[14px] text-neutral-400">Totaal Actieve Leden</p>
                    <p className="text-[28px] font-bold text-neutral-50">{memberStats?.totalActive ?? 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-neutral-500">Netto groei ({PERIODS.find(p => p.value === period)?.label})</p>
                    <p className={`text-[20px] font-bold ${(memberStats?.netGrowth ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(memberStats?.netGrowth ?? 0) >= 0 ? '+' : ''}{memberStats?.netGrowth ?? 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-center">
                    <p className="text-[18px] font-bold text-emerald-300">{memberStats?.fighters ?? 0}</p>
                    <p className="text-[11px] text-emerald-300/70">Fighters</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-center">
                    <p className="text-[18px] font-bold text-amber-300">{memberStats?.coaches ?? 0}</p>
                    <p className="text-[11px] text-amber-300/70">Coaches</p>
                  </div>
                  <div className="p-3 bg-sky-500/10 border border-sky-500/40 rounded-xl text-center">
                    <p className="text-[18px] font-bold text-sky-300">{memberStats?.staff ?? 0}</p>
                    <p className="text-[11px] text-sky-300/70">Staff</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Check-in Heatmap by Day */}
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-medium text-neutral-50">Check-ins per Dag</h3>
              <span className="text-[12px] text-neutral-500">Afgelopen {getPeriodDays(period)} dagen</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, i) => {
                const dayStats = checkinStats?.byDay?.[i] ?? 0
                const maxDay = Math.max(...(checkinStats?.byDay ?? [1]))
                const intensity = maxDay > 0 ? dayStats / maxDay : 0
                return (
                  <div key={day} className="text-center">
                    <p className="text-[12px] text-neutral-500 mb-2">{day}</p>
                    <div
                      className="h-16 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `rgba(251, 191, 36, ${0.1 + intensity * 0.4})`,
                        borderWidth: 1,
                        borderColor: `rgba(251, 191, 36, ${0.2 + intensity * 0.3})`,
                      }}
                    >
                      <span className="text-[16px] font-bold text-amber-300">{dayStats}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function ReportCard({
  label,
  value,
  change,
  icon: Icon,
  negative = false,
}: {
  label: string
  value: number | string
  change: number
  icon: typeof Users
  negative?: boolean
}) {
  const isPositive = negative ? change <= 0 : change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-5"
      style={{
        position: 'relative',
        '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        '--border-radius-before': '24px',
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-white/5 rounded-xl">
          <Icon className="text-neutral-400" size={18} strokeWidth={1.5} />
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-[12px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            <TrendIcon size={14} strokeWidth={1.5} />
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-[24px] font-bold text-neutral-50">{value}</p>
      <p className="text-[12px] text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

// Custom hooks for fetching report data
function useMemberStats(period: Period) {
  const days = getPeriodDays(period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - days)

  return useQuery({
    queryKey: ['report-member-stats', period],
    queryFn: async () => {
      // Get new members in period
      const { data: newMembers } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', startDate.toISOString())

      // Get new members in previous period
      const { data: prevNewMembers } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // Get cancellations
      const { data: cancellations } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'cancelled')
        .gte('updated_at', startDate.toISOString())

      // Get current active members
      const { data: activeMembers } = await supabase
        .from('members')
        .select('id, role')
        .eq('status', 'active')

      const newCount = newMembers?.length ?? 0
      const prevNewCount = prevNewMembers?.length ?? 0
      const cancelCount = cancellations?.length ?? 0

      return {
        newMembers: newCount,
        newMembersChange: prevNewCount > 0 ? Math.round((newCount - prevNewCount) / prevNewCount * 100) : 0,
        cancellations: cancelCount,
        cancellationsChange: 0, // Would need previous period data
        totalActive: activeMembers?.length ?? 0,
        netGrowth: newCount - cancelCount,
        fighters: activeMembers?.filter(m => m.role === 'fighter').length ?? 0,
        coaches: activeMembers?.filter(m => m.role === 'coach').length ?? 0,
        staff: activeMembers?.filter(m => ['admin', 'medewerker', 'coordinator'].includes(m.role)).length ?? 0,
      }
    },
  })
}

function useCheckinStats(period: Period) {
  const days = getPeriodDays(period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - days)

  return useQuery({
    queryKey: ['report-checkin-stats', period],
    queryFn: async () => {
      // Get checkins in period
      const { data: checkins } = await supabase
        .from('checkins')
        .select('id, member_id, checkin_at')
        .gte('checkin_at', startDate.toISOString())

      // Get checkins in previous period
      const { data: prevCheckins } = await supabase
        .from('checkins')
        .select('id')
        .gte('checkin_at', prevStartDate.toISOString())
        .lt('checkin_at', startDate.toISOString())

      // Get active member count
      const { data: activeMembers } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')

      const total = checkins?.length ?? 0
      const prevTotal = prevCheckins?.length ?? 0
      const memberCount = activeMembers?.length ?? 1

      // Count by day of week (0 = Monday in our UI)
      const byDay = [0, 0, 0, 0, 0, 0, 0]
      checkins?.forEach(c => {
        const day = new Date(c.checkin_at).getDay()
        // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
        const index = day === 0 ? 6 : day - 1
        byDay[index]++
      })

      return {
        total,
        change: prevTotal > 0 ? Math.round((total - prevTotal) / prevTotal * 100) : 0,
        avgPerMember: total / memberCount,
        avgChange: 0, // Would need more calculation
        byDay,
      }
    },
  })
}

function useTopDisciplines(period: Period) {
  const days = getPeriodDays(period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return useQuery({
    queryKey: ['report-top-disciplines', period],
    queryFn: async () => {
      // Get reservations with check-ins grouped by discipline
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          classes:class_id (
            disciplines:discipline_id (id, name, color)
          )
        `)
        .eq('status', 'checked_in')
        .gte('reservation_date', startDate.toISOString().split('T')[0])

      // Count by discipline
      const disciplineCounts = new Map<string, { name: string; color: string; count: number }>()

      reservations?.forEach(r => {
        const cls = r.classes as { disciplines: { id: string; name: string; color: string } | null } | null
        const discipline = cls?.disciplines
        if (discipline) {
          const existing = disciplineCounts.get(discipline.id)
          if (existing) {
            existing.count++
          } else {
            disciplineCounts.set(discipline.id, {
              name: discipline.name,
              color: discipline.color,
              count: 1,
            })
          }
        }
      })

      // Convert to array and sort
      const sorted = Array.from(disciplineCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const total = sorted.reduce((sum, d) => sum + d.count, 0)

      return sorted.map(d => ({
        name: d.name,
        color: d.color,
        checkins: d.count,
        percentage: total > 0 ? Math.round(d.count / total * 100) : 0,
      }))
    },
  })
}
