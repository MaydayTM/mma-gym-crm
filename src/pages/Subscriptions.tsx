// src/pages/Subscriptions.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CreditCard, Users, TrendingUp, Pause, XCircle, Search, Filter, Settings } from 'lucide-react'
import { useSubscriptions, useSubscriptionStats } from '../hooks/useSubscriptions'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { usePermissions } from '../hooks/usePermissions'

export function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const { canEditMembers } = usePermissions()
  const { data: subscriptions, isLoading } = useSubscriptions(statusFilter)
  const { data: stats } = useSubscriptionStats()

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    if (!searchQuery) return true
    const fullName = `${sub.members?.first_name} ${sub.members?.last_name}`.toLowerCase()
    const email = sub.members?.email?.toLowerCase() || ''
    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Abonnementen</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Beheer lidmaatschappen en betalingen</p>
        </div>
        {canEditMembers && (
          <div className="flex items-center gap-3">
            <Link
              to="/subscriptions/manage"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 text-neutral-300 px-5 py-3 text-[14px] font-medium hover:bg-white/5 transition"
            >
              <Settings size={18} strokeWidth={1.5} />
              <span>Beheren</span>
            </Link>
            <a
              href="/checkout/plans"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
            >
              <Plus size={18} strokeWidth={1.5} />
              <span>Nieuw Abonnement</span>
            </a>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="text-emerald-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.active || 0}</p>
          <p className="text-[13px] text-neutral-500">Actieve abonnementen</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="text-amber-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">
            €{(stats?.total_mrr || 0).toFixed(0)}
          </p>
          <p className="text-[13px] text-neutral-500">MRR</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Pause className="text-blue-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.frozen || 0}</p>
          <p className="text-[13px] text-neutral-500">Gepauzeerd</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <XCircle className="text-rose-300" size={20} />
            </div>
          </div>
          <p className="text-[28px] font-bold text-neutral-50">{stats?.cancelled || 0}</p>
          <p className="text-[13px] text-neutral-500">Opgezegd</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Zoek op naam of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-500" />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
          >
            <option value="">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="frozen">Gepauzeerd</option>
            <option value="cancelled">Opgezegd</option>
            <option value="expired">Verlopen</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-300 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !filteredSubscriptions?.length ? (
          <div className="p-12 text-center">
            <CreditCard className="text-neutral-600 mx-auto mb-4" size={48} />
            <p className="text-neutral-400">Geen abonnementen gevonden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Lid
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Prijs
                </th>
                <th className="text-left px-6 py-4 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {sub.members?.profile_picture_url ? (
                        <img
                          src={sub.members.profile_picture_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-[14px] font-medium text-neutral-400">
                            {sub.members?.first_name?.[0]}{sub.members?.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-medium text-neutral-200">
                          {sub.members?.first_name} {sub.members?.last_name}
                        </p>
                        <p className="text-[12px] text-neutral-500">{sub.members?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-neutral-200">
                      {sub.plan_types?.name || '-'}
                    </p>
                    <p className="text-[12px] text-neutral-500">
                      {sub.age_groups?.name || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-neutral-200">
                      {format(new Date(sub.start_date), 'd MMM yyyy', { locale: nl })}
                    </p>
                    {sub.end_date && (
                      <p className="text-[12px] text-neutral-500">
                        tot {format(new Date(sub.end_date), 'd MMM yyyy', { locale: nl })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-medium text-amber-300">
                      €{(sub.final_price || 0).toFixed(2)}
                    </p>
                    {sub.duration_months && (
                      <p className="text-[12px] text-neutral-500">
                        {sub.duration_months} maand{sub.duration_months > 1 ? 'en' : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
                      sub.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : sub.status === 'frozen'
                        ? 'bg-blue-500/10 text-blue-300'
                        : sub.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-300'
                        : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sub.status === 'active'
                          ? 'bg-emerald-400'
                          : sub.status === 'frozen'
                          ? 'bg-blue-400'
                          : sub.status === 'cancelled'
                          ? 'bg-rose-400'
                          : 'bg-neutral-400'
                      }`} />
                      {sub.status === 'active' ? 'Actief' :
                       sub.status === 'frozen' ? 'Gepauzeerd' :
                       sub.status === 'cancelled' ? 'Opgezegd' :
                       sub.status === 'expired' ? 'Verlopen' : sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
