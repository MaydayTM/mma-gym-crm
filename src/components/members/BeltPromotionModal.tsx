import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { usePromoteMember } from '../../hooks/useMemberBelts'
import { useMembers } from '../../hooks/useMembers'

interface BeltPromotionModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  currentBelt: {
    discipline_id: string
    disciplines: { name: string; color: string | null } | null
    belt_color: string
    stripes: number | null
    dan_grade: number | null
    training_count?: number
  }
}

const BELT_ORDER = ['white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black']
const BELT_LABELS: Record<string, string> = {
  white: 'Wit',
  yellow: 'Geel',
  green: 'Groen',
  blue: 'Blauw',
  purple: 'Paars',
  brown: 'Bruin',
  black: 'Zwart',
}

export function BeltPromotionModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  currentBelt,
}: BeltPromotionModalProps) {
  const [toBelt, setToBelt] = useState(currentBelt.belt_color)
  const [toStripes, setToStripes] = useState(currentBelt.stripes || 0)
  const [toDan, setToDan] = useState<number | undefined>(currentBelt.dan_grade || undefined)
  const [promotedBy, setPromotedBy] = useState<string>('')
  const [notes, setNotes] = useState('')

  const { mutate: promote, isPending } = usePromoteMember()
  const { data: allMembers } = useMembers()

  // Filter for coaches and staff who can promote
  const coaches = allMembers?.filter(
    (m) => m.role && ['coach', 'admin', 'medewerker'].includes(m.role)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    promote(
      {
        memberId,
        disciplineId: currentBelt.discipline_id,
        fromBelt: currentBelt.belt_color,
        fromStripes: currentBelt.stripes || 0,
        toBelt,
        toStripes,
        toDan: toBelt === 'black' ? toDan : undefined,
        promotedBy: promotedBy || undefined,
        trainingsAtPromotion: currentBelt.training_count || 0,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const isBlackBelt = toBelt === 'black'
  const currentBeltIndex = BELT_ORDER.indexOf(currentBelt.belt_color)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gordel Promotie" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member info */}
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-[14px] text-neutral-300">
            <span className="text-neutral-500">Lid:</span> {memberName}
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Discipline:</span>{' '}
            <span style={{ color: currentBelt.disciplines?.color || '#fff' }}>
              {currentBelt.disciplines?.name}
            </span>
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Huidige gordel:</span>{' '}
            {BELT_LABELS[currentBelt.belt_color]} {currentBelt.stripes || 0} stripes
          </p>
          <p className="text-[14px] text-neutral-300 mt-1">
            <span className="text-neutral-500">Trainingen:</span>{' '}
            {currentBelt.training_count || 0}
          </p>
        </div>

        {/* New belt selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Nieuwe Gordel
            </label>
            <select
              value={toBelt}
              onChange={(e) => {
                setToBelt(e.target.value)
                if (e.target.value !== 'black') setToDan(undefined)
              }}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              {BELT_ORDER.slice(currentBeltIndex).map((belt) => (
                <option key={belt} value={belt}>
                  {BELT_LABELS[belt]}
                </option>
              ))}
            </select>
          </div>

          {isBlackBelt ? (
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Dan
              </label>
              <select
                value={toDan || 1}
                onChange={(e) => setToDan(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((dan) => (
                  <option key={dan} value={dan}>
                    {dan}e Dan
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Stripes
              </label>
              <select
                value={toStripes}
                onChange={(e) => setToStripes(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                {[0, 1, 2, 3, 4].map((s) => (
                  <option key={s} value={s}>
                    {s} stripe{s !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Promoted by */}
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Gepromoveerd door (optioneel)
          </label>
          <select
            value={promotedBy}
            onChange={(e) => setPromotedBy(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
          >
            <option value="">Selecteer coach...</option>
            {coaches?.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.first_name} {coach.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Notities (optioneel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Bijv. 'Gepromoveerd tijdens seminar'"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
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
            {isPending ? 'Opslaan...' : 'Promotie Registreren'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
