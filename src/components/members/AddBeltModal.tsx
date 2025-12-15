import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { useDisciplines } from '../../hooks/useDisciplines'
import { useAddMemberBelt } from '../../hooks/useMemberBelts'

interface AddBeltModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  existingDisciplineIds: string[]
}

// Belt order for BJJ/Luta Livre (kids/youth): wit-geel-oranje-groen-blauw-paars-bruin-zwart
const BELT_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black']
const BELT_LABELS: Record<string, string> = {
  white: 'Wit',
  yellow: 'Geel',
  orange: 'Oranje',
  green: 'Groen',
  blue: 'Blauw',
  purple: 'Paars',
  brown: 'Bruin',
  black: 'Zwart',
}

export function AddBeltModal({
  isOpen,
  onClose,
  memberId,
  existingDisciplineIds,
}: AddBeltModalProps) {
  const [disciplineId, setDisciplineId] = useState('')
  const [beltColor, setBeltColor] = useState('white')
  const [stripes, setStripes] = useState(0)
  const [danGrade, setDanGrade] = useState<number | undefined>()

  const { data: disciplines } = useDisciplines()
  const { mutate: addBelt, isPending } = useAddMemberBelt()

  // Filter out disciplines that already have belts and only show those with belt systems
  const availableDisciplines = disciplines?.filter(
    (d) => d.has_belt_system && !existingDisciplineIds.includes(d.id)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!disciplineId) return

    addBelt(
      {
        member_id: memberId,
        discipline_id: disciplineId,
        belt_color: beltColor,
        stripes,
        dan_grade: beltColor === 'black' ? danGrade : null,
      },
      {
        onSuccess: () => {
          // Reset form
          setDisciplineId('')
          setBeltColor('white')
          setStripes(0)
          setDanGrade(undefined)
          onClose()
        },
      }
    )
  }

  const isBlackBelt = beltColor === 'black'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gordel Toevoegen" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {availableDisciplines && availableDisciplines.length > 0 ? (
          <>
            {/* Discipline selection */}
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Discipline
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                <option value="">Selecteer discipline...</option>
                {availableDisciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Belt selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                  Gordel
                </label>
                <select
                  value={beltColor}
                  onChange={(e) => {
                    setBeltColor(e.target.value)
                    if (e.target.value !== 'black') setDanGrade(undefined)
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                >
                  {BELT_ORDER.map((belt) => (
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
                    value={danGrade || 1}
                    onChange={(e) => setDanGrade(Number(e.target.value))}
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
                    value={stripes}
                    onChange={(e) => setStripes(Number(e.target.value))}
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
                disabled={isPending || !disciplineId}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                {isPending ? 'Opslaan...' : 'Toevoegen'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-[14px] text-neutral-500">
              Alle disciplines met gordelsysteem zijn al toegevoegd.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-[14px] text-amber-300 hover:text-amber-200"
            >
              Sluiten
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
