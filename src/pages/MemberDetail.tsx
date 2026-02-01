import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  LogIn,
  Loader2,
  Plus,
} from 'lucide-react'
import { Modal } from '../components/ui'
import { EditMemberForm } from '../components/members/EditMemberForm'
import { BeltProgressCard } from '../components/members/BeltProgressCard'
import { DoorAccessCard } from '../components/members/DoorAccessCard'
import { AssignSubscriptionModal } from '../components/members/AssignSubscriptionModal'
import { useMember } from '../hooks/useMember'
import { useMemberSubscriptions } from '../hooks/useMemberSubscriptions'
import { useMemberCheckins } from '../hooks/useMemberCheckins'
import { useDeleteMember } from '../hooks/useDeleteMember'
import { useCheckin } from '../hooks/useCheckin'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../hooks/useAuth'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

  const { data: member, isLoading, error } = useMember(id)
  const { data: subscriptions } = useMemberSubscriptions(id)
  const { data: checkins } = useMemberCheckins(id, 20)
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember()
  const { mutate: checkin, isPending: isCheckingIn } = useCheckin()
  const permissions = usePermissions()
  const { member: currentMember } = useAuth()

  const handleDelete = () => {
    if (!id) return
    deleteMember(id, {
      onSuccess: () => {
        navigate('/members')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <div className="h-8 bg-white/5 rounded-xl w-48 animate-pulse" />
        <div className="h-48 bg-white/5 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-50 transition-colors text-[14px]"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          Terug naar leden
        </button>
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6">
          <p className="text-rose-300 text-[14px]">
            {error ? (error as Error).message : 'Lid niet gevonden'}
          </p>
        </div>
      </div>
    )
  }

  const activeSubscription = subscriptions?.find((s) => s.status === 'active')

  // Permission checks
  const isOwnProfile = member.id === currentMember?.id
  const canEdit = permissions.canEditMembers || isOwnProfile
  const canDelete = permissions.isAdmin
  const canAssignSubscription = permissions.canEditMembers
  const canCheckIn = permissions.canCheckInMembers

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/members')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-neutral-50 hover:border-amber-300/70 transition-all"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">
                {member.first_name} {member.last_name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ${getStatusClasses(
                  member.status
                )}`}
              >
                {member.status}
              </span>
            </div>
            <p className="text-[14px] text-neutral-400 mt-1 capitalize">{member.role}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {canDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 text-[15px] text-rose-300 bg-rose-500/10 border border-rose-500/40 rounded-full px-5 py-2.5 hover:bg-rose-500/20 transition"
            >
              <Trash2 size={16} strokeWidth={1.5} />
              <span>Verwijderen</span>
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-5 py-2.5 border border-white/10 hover:border-amber-300/70 transition"
            >
              <Edit3 size={16} strokeWidth={1.5} />
              <span>Bewerken</span>
            </button>
          )}
          {canCheckIn && (
            <button
              onClick={() => id && checkin({ memberId: id })}
              disabled={isCheckingIn}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(52,211,153,0.5)] hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {isCheckingIn ? (
                <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <LogIn size={18} strokeWidth={1.5} />
              )}
              <span>{isCheckingIn ? 'Inchecken...' : 'Check-in'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6"
        style={{
          position: 'relative',
          '--border-gradient':
            'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {member.profile_picture_url ? (
              <img
                src={member.profile_picture_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="w-24 h-24 rounded-3xl object-cover border border-white/10"
              />
            ) : (
              <div className="flex text-[24px] font-medium text-neutral-200 bg-neutral-800 w-24 h-24 rounded-3xl items-center justify-center">
                {member.first_name.charAt(0)}
                {member.last_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em]">
                Contact
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[14px] text-neutral-300">
                  <Mail size={14} className="text-neutral-500" strokeWidth={1.5} />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-[14px] text-neutral-300">
                    <Phone size={14} className="text-neutral-500" strokeWidth={1.5} />
                    {member.phone}
                  </div>
                )}
                {(member.street || member.city) && (
                  <div className="flex items-center gap-2 text-[14px] text-neutral-300">
                    <MapPin size={14} className="text-neutral-500" strokeWidth={1.5} />
                    {[member.street, member.zip_code, member.city].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Personal */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em]">
                Persoonlijk
              </h3>
              <div className="space-y-2">
                {member.birth_date && (
                  <div className="flex items-center gap-2 text-[14px] text-neutral-300">
                    <Calendar size={14} className="text-neutral-500" strokeWidth={1.5} />
                    {formatDate(member.birth_date)}
                  </div>
                )}
                {member.gender && (
                  <div className="text-[14px] text-neutral-300 capitalize">{member.gender}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          label="Check-ins totaal"
          value={member.total_checkins ?? 0}
          icon={Activity}
        />
        <QuickStat
          label="Laatste bezoek"
          value={member.last_checkin_at ? formatRelativeDate(member.last_checkin_at) : 'Nooit'}
          icon={Clock}
        />
        <QuickStat
          label="Lid sinds"
          value={member.member_since ? formatDate(member.member_since) : formatDate(member.created_at!)}
          icon={Calendar}
        />
        <QuickStat
          label="Actief abo"
          value={activeSubscription
            ? (activeSubscription.age_group_name && activeSubscription.plan_type_name
                ? `${activeSubscription.plan_type_name}`
                : activeSubscription.plan_type_name || 'Ja')
            : 'Geen'}
          icon={CreditCard}
        />
      </div>

      {/* Belt Progress & Door Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BeltProgressCard
          memberId={member.id}
          memberName={`${member.first_name} ${member.last_name}`}
        />
        <DoorAccessCard
          memberId={member.id}
          memberStatus={member.status ?? 'active'}
          doorAccessEnabled={member.door_access_enabled ?? true}
        />
      </div>

      {/* Subscriptions */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
        style={{
          position: 'relative',
          '--border-gradient':
            'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-[20px] font-medium text-neutral-50">Abonnementen</h2>
          {canAssignSubscription && (
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-300 text-neutral-950 text-[13px] font-medium hover:bg-amber-200 transition"
            >
              <Plus size={16} />
              Nieuw abonnement
            </button>
          )}
        </div>
        {subscriptions && subscriptions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {subscriptions.map((sub) => {
              // Build display name from age_group and plan_type, or use plan_type_name for legacy
              const displayName = sub.age_group_name && sub.plan_type_name
                ? `${sub.age_group_name} - ${sub.plan_type_name}`
                : sub.plan_type_name || 'Abonnement'

              // Build duration label
              const durationLabel = sub.duration_months === 1 ? 'maand' :
                                   sub.duration_months === 3 ? '3 maanden' :
                                   sub.duration_months === 12 ? 'jaar' :
                                   sub.duration_months ? `${sub.duration_months} maanden` : 'maand'

              return (
                <div
                  key={sub.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <CreditCard size={18} className="text-amber-300" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-50">{displayName}</p>
                      <p className="text-[11px] text-neutral-500">
                        {formatDate(sub.start_date)} - {sub.end_date ? formatDate(sub.end_date) : 'Doorlopend'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] text-neutral-300">
                      {formatCurrency(sub.final_price)}/{durationLabel}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ${getSubscriptionStatusClasses(
                        sub.status
                      )}`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CreditCard size={32} className="text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-neutral-500">Geen abonnementen</p>
          </div>
        )}
      </div>

      {/* Check-ins */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
        style={{
          position: 'relative',
          '--border-gradient':
            'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-[20px] font-medium text-neutral-50">Check-in historie</h2>
        </div>
        {checkins && checkins.length > 0 ? (
          <div className="divide-y divide-white/5">
            {checkins.map((checkin) => (
              <div
                key={checkin.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Activity size={18} className="text-emerald-300" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-50">
                      {formatDateTime(checkin.checkin_at)}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {checkin.class_name ?? 'Open training'} • {checkin.method ?? 'Handmatig'}
                    </p>
                  </div>
                </div>
                {checkin.checkout_at && (
                  <span className="text-[11px] text-neutral-500">
                    Checkout: {formatTime(checkin.checkout_at)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity size={32} className="text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-neutral-500">Geen check-ins</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {member.notes && (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6"
          style={{
            position: 'relative',
            '--border-gradient':
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          <h2 className="text-[20px] font-medium text-neutral-50 mb-4">Notities</h2>
          <p className="text-[14px] text-neutral-300 whitespace-pre-wrap">{member.notes}</p>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Lid bewerken"
        size="lg"
      >
        <EditMemberForm
          member={member}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Lid verwijderen"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-[14px] text-neutral-300">
            Weet je zeker dat je <strong>{member.first_name} {member.last_name}</strong> wilt
            verwijderen? Deze actie kan niet ongedaan gemaakt worden.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 text-white px-6 py-3 text-[15px] font-medium hover:bg-rose-600 transition disabled:opacity-50"
            >
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Subscription Modal */}
      {isSubscriptionModalOpen && (
        <AssignSubscriptionModal
          memberId={member.id}
          memberName={`${member.first_name} ${member.last_name}`}
          onClose={() => setIsSubscriptionModalOpen(false)}
        />
      )}
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}) {
  return (
    <div
      className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4"
      style={{
        position: 'relative',
        '--border-gradient':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        '--border-radius-before': '16px',
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
          <Icon size={18} className="text-neutral-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-[0.22em]">{label}</p>
          <p className="text-[16px] font-medium text-neutral-50">{value}</p>
        </div>
      </div>
    </div>
  )
}

function getStatusClasses(status: string | null): string {
  const statuses: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    frozen: 'bg-sky-500/10 text-sky-300 border-sky-500/40',
    cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
    lead: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
  }
  return statuses[status || ''] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/40'
}

function getSubscriptionStatusClasses(status: string | null): string {
  const statuses: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    frozen: 'bg-sky-500/10 text-sky-300 border-sky-500/40',
    cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
    expired: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/40',
  }
  return statuses[status || ''] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/40'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Vandaag'
  if (diffDays === 1) return 'Gisteren'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
  return formatDate(dateString)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}
