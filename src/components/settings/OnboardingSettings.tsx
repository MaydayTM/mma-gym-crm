import { useState } from 'react'
import { Mail, Users, Clock, CheckCircle2, Send, RefreshCw, AlertCircle } from 'lucide-react'
import { useClaimAccountStats, useUnclaimedMembers, useSendClaimEmail, useSendBulkClaimEmails } from '../../hooks/useClaimAccount'

type FilterType = 'all' | 'no_invite' | 'pending'

export function OnboardingSettings() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const { data: stats, isLoading: statsLoading } = useClaimAccountStats()
  const { data: members, isLoading: membersLoading, refetch } = useUnclaimedMembers(filter)
  const sendClaimEmail = useSendClaimEmail()
  const sendBulkClaimEmails = useSendBulkClaimEmails()

  const handleSendEmail = async (memberId: string, resend = false) => {
    setSendingTo(memberId)
    try {
      await sendClaimEmail.mutateAsync({ memberId, resend })
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setSendingTo(null)
    }
  }

  const handleSendBulk = async () => {
    if (selectedMembers.size === 0) return

    try {
      const result = await sendBulkClaimEmails.mutateAsync(Array.from(selectedMembers))
      alert(`${result.successful} van ${result.total} emails verstuurd`)
      setSelectedMembers(new Set())
    } catch (error) {
      console.error('Error sending bulk emails:', error)
    }
  }

  const toggleSelectAll = () => {
    if (!members) return
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)))
    }
  }

  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMembers)
    if (newSet.has(memberId)) {
      newSet.delete(memberId)
    } else {
      newSet.add(memberId)
    }
    setSelectedMembers(newSet)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Member Onboarding</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Nodig bestaande leden uit om hun account te activeren
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Nog uit te nodigen"
          value={stats?.unclaimed_members ?? '-'}
          color="amber"
          loading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="Uitnodiging verstuurd"
          value={stats?.pending_tokens ?? '-'}
          color="sky"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Geactiveerd"
          value={stats?.claimed_accounts ?? '-'}
          color="emerald"
          loading={statsLoading}
        />
        <StatCard
          icon={AlertCircle}
          label="Verlopen tokens"
          value={stats?.expired_tokens ?? '-'}
          color="rose"
          loading={statsLoading}
        />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 border border-neutral-800">
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as FilterType)
              setSelectedMembers(new Set())
            }}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Alle niet-geactiveerd</option>
            <option value="no_invite">Nog niet uitgenodigd</option>
            <option value="pending">Uitnodiging verstuurd</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            title="Ververs lijst"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {selectedMembers.size > 0 && (
            <span className="text-sm text-neutral-400">
              {selectedMembers.size} geselecteerd
            </span>
          )}
          <button
            onClick={handleSendBulk}
            disabled={selectedMembers.size === 0 || sendBulkClaimEmails.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-medium rounded-lg transition-colors text-sm"
          >
            <Send size={16} />
            {sendBulkClaimEmails.isPending ? 'Versturen...' : 'Verstuur geselecteerde'}
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={members?.length ? selectedMembers.size === members.length : false}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Lid
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Lidnummer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Actie
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {membersLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Laden...
                </td>
              </tr>
            ) : !members?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Geen leden gevonden
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">
                      {member.first_name} {member.last_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {member.email || <span className="text-neutral-600 italic">Geen email</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {member.clubplanner_member_nr || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {member.has_pending_token ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs">
                        <Clock size={12} />
                        Verstuurd
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-700 text-neutral-400 rounded-full text-xs">
                        Niet uitgenodigd
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSendEmail(member.id, member.has_pending_token)}
                      disabled={sendingTo === member.id || !member.email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail size={14} />
                      {sendingTo === member.id
                        ? 'Versturen...'
                        : member.has_pending_token
                          ? 'Opnieuw'
                          : 'Uitnodigen'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
        <h3 className="text-sm font-medium text-white mb-2">Hoe werkt het?</h3>
        <ol className="text-sm text-neutral-400 space-y-1 list-decimal list-inside">
          <li>Selecteer leden die je wilt uitnodigen of klik op "Uitnodigen" bij een individueel lid</li>
          <li>Het lid ontvangt een email met een activatielink (geldig 48 uur)</li>
          <li>Na klikken op de link kan het lid een wachtwoord instellen</li>
          <li>Het account wordt automatisch gekoppeld aan het bestaande lidmaatschap</li>
        </ol>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number | string
  color: 'amber' | 'sky' | 'emerald' | 'rose'
  loading?: boolean
}

function StatCard({ icon: Icon, label, value, color, loading }: StatCardProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-400',
    sky: 'bg-sky-500/10 text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-400',
  }

  return (
    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-xl font-semibold text-white">
            {loading ? '...' : value}
          </p>
        </div>
      </div>
    </div>
  )
}
