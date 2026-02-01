import { useState } from 'react'
import { Pause, XCircle, Play, Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { useCancelSubscription, useFreezeSubscription, useUnfreezeSubscription } from '../../hooks/useSubscriptions'
import { usePermissions } from '../../hooks/usePermissions'
import type { CombinedSubscription } from '../../hooks/useMemberSubscriptions'

interface SubscriptionActionsProps {
  subscription: CombinedSubscription
}

export function SubscriptionActions({ subscription }: SubscriptionActionsProps) {
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [frozenUntilDate, setFrozenUntilDate] = useState('')

  const { canEditMembers } = usePermissions()
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription()
  const { mutate: freezeSubscription, isPending: isFreezing } = useFreezeSubscription()
  const { mutate: unfreezeSubscription, isPending: isUnfreezing } = useUnfreezeSubscription()

  // Only show actions for staff users
  if (!canEditMembers) {
    return null
  }

  const handleFreeze = () => {
    if (!frozenUntilDate) return

    freezeSubscription(
      { subscriptionId: subscription.id, frozenUntil: frozenUntilDate },
      {
        onSuccess: () => {
          setIsFreezeModalOpen(false)
          setFrozenUntilDate('')
        }
      }
    )
  }

  const handleCancel = () => {
    cancelSubscription(subscription.id, {
      onSuccess: () => {
        setIsCancelModalOpen(false)
      }
    })
  }

  const handleUnfreeze = () => {
    unfreezeSubscription(subscription.id)
  }

  // Active subscription: show freeze and cancel buttons
  if (subscription.status === 'active') {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFreezeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-neutral-300 text-[12px] font-medium hover:bg-white/5 transition"
          >
            <Pause size={14} strokeWidth={1.5} />
            Pauzeren
          </button>
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-500/40 text-rose-300 text-[12px] font-medium hover:bg-rose-500/10 transition"
          >
            <XCircle size={14} strokeWidth={1.5} />
            Opzeggen
          </button>
        </div>

        {/* Freeze Modal */}
        <Modal
          isOpen={isFreezeModalOpen}
          onClose={() => setIsFreezeModalOpen(false)}
          title="Abonnement pauzeren"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-[14px] text-neutral-300">
              Selecteer tot wanneer dit abonnement gepauzeerd moet blijven. De einddatum wordt automatisch verlengd met de gepauzeerde periode.
            </p>
            <div>
              <label htmlFor="frozen-until" className="block text-[13px] font-medium text-neutral-200 mb-2">
                Gepauzeerd tot
              </label>
              <input
                id="frozen-until"
                type="date"
                value={frozenUntilDate}
                onChange={(e) => setFrozenUntilDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 focus:outline-none focus:border-amber-300/50 transition"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                disabled={isFreezing}
                className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleFreeze}
                disabled={isFreezing || !frozenUntilDate}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 text-white px-6 py-3 text-[15px] font-medium hover:bg-blue-600 transition disabled:opacity-50"
              >
                {isFreezing ? (
                  <>
                    <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
                    Pauzeren...
                  </>
                ) : (
                  'Pauzeren'
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Abonnement opzeggen"
          size="sm"
        >
          <div className="space-y-6">
            <p className="text-[14px] text-neutral-300">
              Weet je zeker dat je dit abonnement wilt opzeggen? Het lid verliest toegang tot de gym tenzij ze een ander actief abonnement hebben.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 text-white px-6 py-3 text-[15px] font-medium hover:bg-rose-600 transition disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
                    Opzeggen...
                  </>
                ) : (
                  'Opzeggen'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  // Frozen subscription: show unfreeze button
  if (subscription.status === 'frozen') {
    return (
      <button
        onClick={handleUnfreeze}
        disabled={isUnfreezing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/10 transition disabled:opacity-50"
      >
        {isUnfreezing ? (
          <>
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            Hervatten...
          </>
        ) : (
          <>
            <Play size={14} strokeWidth={1.5} />
            Hervatten
          </>
        )}
      </button>
    )
  }

  // Cancelled or expired: no actions
  return null
}
