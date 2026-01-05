import { useState, useMemo } from 'react'
import {
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react'
import { useMembers, type Member } from '../../hooks/useMembers'
import { usePermissions, ROLE_INFO, TEAM_ROLES, type Role } from '../../hooks/usePermissions'
import { Modal } from '../ui'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// Volgorde van rollen in de UI
const ROLE_ORDER: Role[] = ['admin', 'medewerker', 'coordinator', 'coach', 'fighter', 'fan']

// Kleur mapping voor Tailwind
const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string; badge: string }> = {
  admin: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300'
  },
  medewerker: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300'
  },
  coordinator: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300'
  },
  coach: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  fighter: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
  fan: {
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    border: 'border-neutral-500/30',
    badge: 'bg-neutral-500/20 text-neutral-400'
  },
}

export function RolesSettings() {
  const { data: members = [], isLoading } = useMembers()
  const { canManageRoles, isAdmin } = usePermissions()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRoles, setExpandedRoles] = useState<Role[]>(['admin', 'medewerker', 'coordinator', 'coach'])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Filter en groepeer members per rol
  const { membersByRole, filteredCount } = useMemo(() => {
    const filtered = members.filter(m => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      )
    })

    const grouped = ROLE_ORDER.reduce((acc, role) => {
      acc[role] = filtered.filter(m => m.role === role)
      return acc
    }, {} as Record<Role, Member[]>)

    return {
      membersByRole: grouped,
      filteredCount: filtered.length
    }
  }, [members, searchQuery])

  // Toggle rol sectie
  const toggleRole = (role: Role) => {
    setExpandedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  // Toggle member selectie
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Selecteer alle leden in een rol
  const selectAllInRole = (role: Role) => {
    const memberIds = membersByRole[role].map(m => m.id)
    const allSelected = memberIds.every(id => selectedMembers.includes(id))

    if (allSelected) {
      setSelectedMembers(prev => prev.filter(id => !memberIds.includes(id)))
    } else {
      setSelectedMembers(prev => [...new Set([...prev, ...memberIds])])
    }
  }

  // Stats voor header
  const stats = useMemo(() => ({
    total: members.length,
    team: members.filter(m => TEAM_ROLES.includes(m.role as Role)).length,
    fighters: members.filter(m => m.role === 'fighter').length,
    fans: members.filter(m => m.role === 'fan').length,
  }), [members])

  if (!canManageRoles) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="text-rose-400" size={28} />
        </div>
        <h3 className="text-lg font-medium text-neutral-200 mb-2">Geen toegang</h3>
        <p className="text-sm text-neutral-500 max-w-sm">
          Je hebt geen rechten om rollen te beheren. Neem contact op met een administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header met stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Totaal"
          value={stats.total}
          icon={Users}
          color="neutral"
        />
        <StatCard
          label="Team"
          value={stats.team}
          icon={Shield}
          color="amber"
        />
        <StatCard
          label="Fighters"
          value={stats.fighters}
          icon={Users}
          color="emerald"
        />
        <StatCard
          label="Fans"
          value={stats.fans}
          icon={Users}
          color="neutral"
        />
      </div>

      {/* Zoeken en bulk acties */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Zoek op naam of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-300/70"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
              {filteredCount} gevonden
            </span>
          )}
        </div>

        {selectedMembers.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">
              {selectedMembers.length} geselecteerd
            </span>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-300 text-neutral-950 text-sm font-medium hover:bg-amber-200 transition"
            >
              <UserPlus size={16} />
              Rol wijzigen
            </button>
            <button
              onClick={() => setSelectedMembers([])}
              className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-500"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Rollen accordeon */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {ROLE_ORDER.map(role => {
            const roleMembers = membersByRole[role]
            const isExpanded = expandedRoles.includes(role)
            const colors = ROLE_COLORS[role]
            const info = ROLE_INFO[role]
            const allSelected = roleMembers.length > 0 && roleMembers.every(m => selectedMembers.includes(m.id))

            return (
              <div
                key={role}
                className={`rounded-2xl border ${colors.border} bg-gradient-to-br from-white/5 to-white/0 overflow-hidden`}
              >
                {/* Rol header */}
                <button
                  onClick={() => toggleRole(role)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Shield className={colors.text} size={18} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-medium text-neutral-100">
                          {info.label}s
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${colors.badge}`}>
                          {roleMembers.length}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">{info.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="text-neutral-500" size={20} />
                  ) : (
                    <ChevronRight className="text-neutral-500" size={20} />
                  )}
                </button>

                {/* Leden lijst */}
                {isExpanded && (
                  <div className="border-t border-white/5">
                    {roleMembers.length > 0 ? (
                      <>
                        {/* Selecteer alles header */}
                        {isAdmin && (
                          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3">
                            <button
                              onClick={() => selectAllInRole(role)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                                allSelected
                                  ? 'bg-amber-300 border-amber-300'
                                  : 'border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              {allSelected && <Check size={14} className="text-neutral-950" />}
                            </button>
                            <span className="text-xs text-neutral-500">
                              {allSelected ? 'Deselecteer alles' : 'Selecteer alles'}
                            </span>
                          </div>
                        )}

                        {/* Leden */}
                        <div className="divide-y divide-white/5">
                          {roleMembers.map(member => (
                            <MemberRow
                              key={member.id}
                              member={member}
                              isSelected={selectedMembers.includes(member.id)}
                              onToggleSelect={() => toggleMemberSelection(member.id)}
                              onEdit={() => setEditingMember(member)}
                              showCheckbox={isAdmin}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-neutral-500">
                          Geen {info.label.toLowerCase()}s gevonden
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Enkele rol wijzigen modal */}
      {editingMember && (
        <ChangeRoleModal
          member={editingMember}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Bulk rol wijzigen modal */}
      <BulkChangeRoleModal
        memberIds={selectedMembers}
        members={members.filter(m => selectedMembers.includes(m.id))}
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false)
          setSelectedMembers([])
        }}
      />
    </div>
  )
}

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string
  value: number
  icon: typeof Users
  color: 'neutral' | 'amber' | 'emerald'
}) {
  const colorClasses = {
    neutral: 'bg-neutral-500/10 text-neutral-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-neutral-100">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Member row component
function MemberRow({
  member,
  isSelected,
  onToggleSelect,
  onEdit,
  showCheckbox
}: {
  member: Member
  isSelected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  showCheckbox: boolean
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition group">
      <div className="flex items-center gap-3">
        {showCheckbox && (
          <button
            onClick={onToggleSelect}
            className={`w-5 h-5 rounded border flex items-center justify-center transition ${
              isSelected
                ? 'bg-amber-300 border-amber-300'
                : 'border-neutral-600 group-hover:border-neutral-500'
            }`}
          >
            {isSelected && <Check size={14} className="text-neutral-950" />}
          </button>
        )}

        {member.profile_picture_url ? (
          <img
            src={member.profile_picture_url}
            alt={`${member.first_name} ${member.last_name}`}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-400">
            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-neutral-200">
            {member.first_name} {member.last_name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {member.email && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Mail size={11} />
                {member.email}
              </span>
            )}
            {member.phone && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Phone size={11} />
                {member.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-amber-300 hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
      >
        Rol wijzigen
      </button>
    </div>
  )
}

// Enkele rol wijzigen modal
function ChangeRoleModal({
  member,
  isOpen,
  onClose
}: {
  member: Member
  isOpen: boolean
  onClose: () => void
}) {
  const [newRole, setNewRole] = useState<Role>(member.role as Role)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { canAssignRole } = usePermissions()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newRole === member.role) {
      onClose()
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', member.id)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rol wijzigen - ${member.first_name} ${member.last_name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
          {member.profile_picture_url ? (
            <img
              src={member.profile_picture_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-medium text-neutral-400">
              {member.first_name.charAt(0)}{member.last_name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-200">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-sm text-neutral-500">{member.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-wide mb-2">
            Huidige rol
          </label>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${ROLE_COLORS[member.role as Role].badge}`}>
            <Shield size={14} />
            {ROLE_INFO[member.role as Role].label}
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-wide mb-2">
            Nieuwe rol
          </label>
          <div className="space-y-2">
            {ROLE_ORDER.map(role => {
              const canAssign = canAssignRole(role)
              const colors = ROLE_COLORS[role]
              const info = ROLE_INFO[role]
              const isSelected = newRole === role
              const isCurrent = member.role === role

              return (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    !canAssign ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={isSelected}
                    onChange={() => canAssign && setNewRole(role)}
                    disabled={!canAssign}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-amber-300' : 'border-neutral-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-300" />}
                  </div>
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Shield className={colors.text} size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${colors.text}`}>{info.label}</p>
                      {isCurrent && (
                        <span className="text-[10px] text-neutral-500 uppercase">huidige</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{info.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-2.5 text-sm text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending || newRole === member.role}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-2.5 text-sm font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Bulk rol wijzigen modal
function BulkChangeRoleModal({
  memberIds,
  members,
  isOpen,
  onClose
}: {
  memberIds: string[]
  members: Member[]
  isOpen: boolean
  onClose: () => void
}) {
  const [newRole, setNewRole] = useState<Role>('fighter')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { canAssignRole } = usePermissions()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .in('id', memberIds)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsPending(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rol wijzigen voor ${memberIds.length} leden`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Preview geselecteerde leden */}
        <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-neutral-800">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              Geselecteerde leden ({members.length})
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-neutral-800">
            {members.slice(0, 5).map(member => (
              <div key={member.id} className="px-4 py-2 flex items-center gap-3">
                {member.profile_picture_url ? (
                  <img
                    src={member.profile_picture_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-400">
                    {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 truncate">
                    {member.first_name} {member.last_name}
                  </p>
                </div>
                <span className={`text-xs ${ROLE_COLORS[member.role as Role].text}`}>
                  {ROLE_INFO[member.role as Role].label}
                </span>
              </div>
            ))}
            {members.length > 5 && (
              <div className="px-4 py-2 text-xs text-neutral-500 text-center">
                +{members.length - 5} meer
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 uppercase tracking-wide mb-2">
            Nieuwe rol voor alle geselecteerde leden
          </label>
          <div className="space-y-2">
            {ROLE_ORDER.map(role => {
              const canAssign = canAssignRole(role)
              const colors = ROLE_COLORS[role]
              const info = ROLE_INFO[role]
              const isSelected = newRole === role

              return (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    !canAssign ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={isSelected}
                    onChange={() => canAssign && setNewRole(role)}
                    disabled={!canAssign}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-amber-300' : 'border-neutral-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-300" />}
                  </div>
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Shield className={colors.text} size={14} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${colors.text}`}>{info.label}</p>
                    <p className="text-xs text-neutral-500">{info.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-2.5 text-sm text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-2.5 text-sm font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? 'Wijzigen...' : `${memberIds.length} leden wijzigen`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
