import { useState } from 'react'
import { Search, Key, Mail, AlertCircle, CheckCircle, Loader2, Shield, UserCog } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { usePermissions, ROLE_INFO, TEAM_ROLES, type Role } from '../../hooks/usePermissions'
import type { Tables } from '../../types/database.types'

type Member = Tables<'members'>

export function SecuritySettings() {
  const { isAdmin, isStaff, currentRole, canModifyMember } = usePermissions()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)

  // Fetch team members (staff + coaches) for management
  const { data: members, isLoading } = useQuery({
    queryKey: ['members-for-security'],
    queryFn: async () => {
      // Admins can see all team members
      // Staff can see coaches and fighters
      const query = supabase
        .from('members')
        .select('*')
        .order('role', { ascending: true })
        .order('first_name', { ascending: true })

      // Filter based on permission level
      if (isAdmin) {
        // Admin can manage everyone
      } else if (isStaff) {
        // Staff can only manage coaches and fighters
        query.in('role', ['coach', 'fighter', 'fan'])
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: isStaff,
  })

  // Filter members by search
  const filteredMembers = members?.filter((member) => {
    if (!searchQuery) return true
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const email = member.email?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  }) || []

  // Group by role
  const membersByRole = filteredMembers.reduce((acc, member) => {
    const role = (member.role as Role) || 'fighter'
    if (!acc[role]) acc[role] = []
    acc[role].push(member)
    return acc
  }, {} as Record<Role, Member[]>)

  const handleResetPassword = (member: Member) => {
    // Check if current user can modify this member
    const memberRole = (member.role as Role) || 'fighter'
    if (!canModifyMember(memberRole)) {
      alert('Je hebt geen rechten om het wachtwoord van deze gebruiker te resetten.')
      return
    }
    setSelectedMember(member)
    setShowResetModal(true)
  }

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-400">Je hebt geen toegang tot deze pagina.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-50">Wachtwoord Beheer</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {isAdmin
              ? 'Reset wachtwoorden voor alle gebruikers'
              : 'Reset wachtwoorden voor coaches en leden'}
          </p>
        </div>
      </div>

      {/* Permission Info */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <UserCog className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-amber-200 font-medium">Jouw permissies ({ROLE_INFO[currentRole as Role]?.label})</p>
            <ul className="text-amber-300/80 mt-1 space-y-1">
              {isAdmin && <li>• Je kunt wachtwoorden resetten voor alle gebruikers</li>}
              {!isAdmin && isStaff && (
                <>
                  <li>• Je kunt wachtwoorden resetten voor coaches en leden</li>
                  <li>• Je kunt GEEN wachtwoorden resetten voor admins of andere medewerkers</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          placeholder="Zoek op naam of email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {(['admin', 'medewerker', 'coordinator', 'coach', 'fighter', 'fan'] as Role[]).map((role) => {
            const roleMembers = membersByRole[role]
            if (!roleMembers?.length) return null

            const roleInfo = ROLE_INFO[role]
            const isTeamRole = TEAM_ROLES.includes(role)
            const canManageThisRole = canModifyMember(role)

            return (
              <div key={role} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-neutral-300">{roleInfo.label}</h3>
                  <span className="text-xs text-neutral-500">({roleMembers.length})</span>
                  {isTeamRole && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-purple-500/10 text-purple-400 rounded">
                      Team
                    </span>
                  )}
                  {!canManageThisRole && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-red-500/10 text-red-400 rounded">
                      Geen toegang
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {roleMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        canManageThisRole
                          ? 'bg-neutral-900 hover:bg-neutral-800'
                          : 'bg-neutral-900/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.profile_picture_url ? (
                          <img
                            src={member.profile_picture_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-sm font-medium text-neutral-400">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-neutral-50">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-neutral-500">{member.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={!canManageThisRole}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canManageThisRole
                            ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <Key size={14} />
                        Reset wachtwoord
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedMember && (
        <PasswordResetModal
          member={selectedMember}
          onClose={() => {
            setShowResetModal(false)
            setSelectedMember(null)
          }}
        />
      )}
    </div>
  )
}

// Password Reset Modal Component
function PasswordResetModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [method, setMethod] = useState<'email' | 'manual'>('email')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Send password reset email
  const sendResetEmailMutation = useMutation({
    mutationFn: async () => {
      if (!member.email) throw new Error('Dit lid heeft geen email adres')

      const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    },
    onSuccess: () => {
      setSuccess(true)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  // Set password directly (admin only - requires Edge Function)
  const setPasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Wachtwoorden komen niet overeen')
      }
      if (newPassword.length < 8) {
        throw new Error('Wachtwoord moet minimaal 8 karakters zijn')
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Niet ingelogd')
      }

      // Call Edge Function to set password
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-set-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: member.id,
            new_password: newPassword,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Kon wachtwoord niet instellen')
      }
    },
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['members-for-security'] })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = () => {
    setError(null)
    if (method === 'email') {
      sendResetEmailMutation.mutate()
    } else {
      setPasswordMutation.mutate()
    }
  }

  const isLoading = sendResetEmailMutation.isPending || setPasswordMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-medium text-neutral-50">Wachtwoord Resetten</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {member.first_name} {member.last_name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-neutral-50 font-medium">
                {method === 'email'
                  ? 'Reset email verzonden!'
                  : 'Wachtwoord ingesteld!'}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                {method === 'email'
                  ? `Een email is verzonden naar ${member.email}`
                  : 'Het nieuwe wachtwoord is nu actief'}
              </p>
            </div>
          ) : (
            <>
              {/* Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Methode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMethod('email')}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                      method === 'email'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <Mail size={18} />
                    <span className="text-sm">Via email</span>
                  </button>
                  <button
                    onClick={() => setMethod('manual')}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                      method === 'manual'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <Key size={18} />
                    <span className="text-sm">Handmatig</span>
                  </button>
                </div>
              </div>

              {method === 'email' ? (
                <div className="p-4 rounded-xl bg-neutral-800/50">
                  <p className="text-sm text-neutral-300">
                    Een email met reset link wordt verzonden naar:
                  </p>
                  <p className="text-amber-300 font-medium mt-1">{member.email}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-300 block mb-1">
                      Nieuw wachtwoord
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimaal 8 karakters"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-300 block mb-1">
                      Bevestig wachtwoord
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Herhaal wachtwoord"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-300">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            {success ? 'Sluiten' : 'Annuleren'}
          </button>
          {!success && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (method === 'manual' && (!newPassword || !confirmPassword))}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white rounded-xl text-sm transition-colors"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {method === 'email' ? 'Verzend reset email' : 'Stel wachtwoord in'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
