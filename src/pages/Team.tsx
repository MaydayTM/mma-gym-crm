import { useState } from 'react'
import { Plus, Shield, Loader2, MoreVertical, Mail, Phone } from 'lucide-react'
import { Modal } from '../components/ui'
import { useMembers } from '../hooks/useMembers'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { usePermissions } from '../hooks/usePermissions'

type TeamRole = 'admin' | 'medewerker' | 'coordinator' | 'coach'

const TEAM_ROLES: { value: TeamRole; label: string; description: string; color: string }[] = [
  { value: 'admin', label: 'Administrator', description: 'Volledige toegang tot alles', color: 'text-rose-400' },
  { value: 'medewerker', label: 'Medewerker', description: 'Leden beheer, check-ins, geen financiën', color: 'text-blue-400' },
  { value: 'coordinator', label: 'Coördinator', description: 'Rooster, groepen, communicatie', color: 'text-purple-400' },
  { value: 'coach', label: 'Coach', description: 'Eigen lessen zien, aanwezigheid', color: 'text-amber-400' },
]

export function Team() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)

  const { isAdmin } = usePermissions()
  // Get all team members (non-fighters)
  const { data: allMembers, isLoading } = useMembers()

  const teamMembers = allMembers?.filter(m =>
    ['admin', 'medewerker', 'coordinator', 'coach'].includes(m.role)
  ) || []

  // Group by role
  const membersByRole = TEAM_ROLES.map(role => ({
    ...role,
    members: teamMembers.filter(m => m.role === role.value)
  }))

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Team</h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            Beheer administrators, medewerkers en coaches
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
          >
            <Plus size={18} strokeWidth={1.5} />
            <span>Teamlid Toevoegen</span>
          </button>
        )}
      </div>

      {/* Team Overview */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {membersByRole.map(roleGroup => (
            <div
              key={roleGroup.value}
              className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
              style={{
                position: 'relative',
                '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                '--border-radius-before': '24px',
              } as React.CSSProperties}
            >
              {/* Role Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className={roleGroup.color} size={20} strokeWidth={1.5} />
                  <div>
                    <h2 className="text-[18px] font-medium text-neutral-50">{roleGroup.label}s</h2>
                    <p className="text-[12px] text-neutral-500">{roleGroup.description}</p>
                  </div>
                </div>
                <span className="text-[13px] text-neutral-500">
                  {roleGroup.members.length} {roleGroup.members.length === 1 ? 'persoon' : 'personen'}
                </span>
              </div>

              {/* Members List */}
              {roleGroup.members.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {roleGroup.members.map(member => (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {member.profile_picture_url ? (
                          <img
                            src={member.profile_picture_url}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-[14px] font-medium text-neutral-300">
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-medium text-neutral-50">
                            {member.first_name} {member.last_name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {member.email && (
                              <span className="flex items-center gap-1 text-[12px] text-neutral-500">
                                <Mail size={12} strokeWidth={1.5} />
                                {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1 text-[12px] text-neutral-500">
                                <Phone size={12} strokeWidth={1.5} />
                                {member.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setEditingMember(member.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-500 hover:text-neutral-300"
                        >
                          <MoreVertical size={18} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[14px] text-neutral-500">
                    Geen {roleGroup.label.toLowerCase()}s toegevoegd
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Role Modal */}
      {editingMember && (
        <EditRoleModal
          memberId={editingMember}
          member={teamMembers.find(m => m.id === editingMember)}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  )
}

function AddTeamMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<TeamRole>('coach')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('members')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          role,
          status: 'active',
        })

      if (insertError) throw insertError

      // Reset form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setRole('coach')

      // Refresh members list
      queryClient.invalidateQueries({ queryKey: ['members'] })

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Teamlid Toevoegen" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[14px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Voornaam *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jan"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Achternaam *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Jansen"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jan@reconnect.academy"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Telefoon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+32 471 12 34 56"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Rol *
          </label>
          <div className="space-y-2">
            {TEAM_ROLES.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  role === r.value
                    ? 'border-amber-300/70 bg-amber-500/10'
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  role === r.value ? 'border-amber-300' : 'border-neutral-600'
                }`}>
                  {role === r.value && (
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-[14px] font-medium ${r.color}`}>{r.label}</p>
                  <p className="text-[12px] text-neutral-500">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending || !firstName || !lastName || !email}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditRoleModal({
  memberId,
  member,
  isOpen,
  onClose
}: {
  memberId: string
  member?: { first_name: string; last_name: string; role: string }
  isOpen: boolean
  onClose: () => void
}) {
  const [role, setRole] = useState<TeamRole>(member?.role as TeamRole || 'coach')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ role })
        .eq('id', memberId)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsPending(false)
    }
  }

  const handleRemoveFromTeam = async () => {
    if (!confirm(`Weet je zeker dat je ${member?.first_name} ${member?.last_name} wilt degraderen naar fighter?`)) {
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ role: 'fighter' })
        .eq('id', memberId)

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
      title={`Rol Wijzigen - ${member?.first_name} ${member?.last_name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[14px]">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {TEAM_ROLES.map(r => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                role === r.value
                  ? 'border-amber-300/70 bg-amber-500/10'
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                role === r.value ? 'border-amber-300' : 'border-neutral-600'
              }`}>
                {role === r.value && (
                  <div className="w-2 h-2 rounded-full bg-amber-300" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-[14px] font-medium ${r.color}`}>{r.label}</p>
                <p className="text-[12px] text-neutral-500">{r.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleRemoveFromTeam}
            disabled={isPending}
            className="text-[14px] text-rose-400 hover:text-rose-300 transition"
          >
            Verwijderen uit team
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              {isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
