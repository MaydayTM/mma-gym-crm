import { useState } from 'react'
import { Award, Plus, ChevronRight, History } from 'lucide-react'
import { Modal } from '../ui'
import { useMemberBelts, useBeltHistory } from '../../hooks/useMemberBelts'
import { BeltPromotionModal } from './BeltPromotionModal'
import { AddBeltModal } from './AddBeltModal'

interface BeltProgressCardProps {
  memberId: string
  memberName: string
}

const BELT_COLORS: Record<string, string> = {
  white: 'bg-white',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  brown: 'bg-amber-700',
  black: 'bg-black',
}

// Belt order for BJJ/Luta Livre (kids/youth): wit-geel-oranje-groen-blauw-paars-bruin-zwart
const BELT_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black']

export function BeltProgressCard({ memberId, memberName }: BeltProgressCardProps) {
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [isAddBeltModalOpen, setIsAddBeltModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null)

  const { data: belts, isLoading } = useMemberBelts(memberId)
  const { data: history } = useBeltHistory(memberId, selectedDisciplineId || undefined)

  const handleOpenPromotion = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId)
    setIsPromotionModalOpen(true)
  }

  const handleOpenHistory = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId)
    setIsHistoryModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  const selectedBelt = belts?.find((b) => b.discipline_id === selectedDisciplineId)

  return (
    <>
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
        style={{
          position: 'relative',
          '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="text-amber-300" size={20} strokeWidth={1.5} />
            <h2 className="text-[20px] font-medium text-neutral-50">Gordels</h2>
          </div>
          <button
            onClick={() => setIsAddBeltModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-[13px] text-amber-300 hover:text-amber-200 transition"
          >
            <Plus size={16} strokeWidth={1.5} />
            Toevoegen
          </button>
        </div>

        {belts && belts.length > 0 ? (
          <div className="divide-y divide-white/5">
            {belts.map((belt) => {
              const beltIndex = BELT_ORDER.indexOf(belt.belt_color)
              const progressPercent = ((beltIndex + 1) / BELT_ORDER.length) * 100

              return (
                <div
                  key={belt.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border border-white/20 ${
                          BELT_COLORS[belt.belt_color] || 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <span
                          className="text-[14px] font-medium"
                          style={{ color: belt.disciplines?.color || '#fff' }}
                        >
                          {belt.disciplines?.name}
                        </span>
                        <span className="text-[14px] text-neutral-300 ml-2 capitalize">
                          {belt.belt_color}
                          {belt.stripes ? ` ${belt.stripes} stripe${belt.stripes > 1 ? 's' : ''}` : ''}
                          {belt.dan_grade ? ` ${belt.dan_grade}e dan` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenHistory(belt.discipline_id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition text-neutral-500 hover:text-neutral-300"
                        title="Geschiedenis"
                      >
                        <History size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleOpenPromotion(belt.discipline_id)}
                        className="inline-flex items-center gap-1 text-[12px] text-amber-300 hover:text-amber-200 transition px-2 py-1 rounded-lg hover:bg-amber-500/10"
                      >
                        Promotie
                        <ChevronRight size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: belt.disciplines?.color || '#3B82F6',
                      }}
                    />
                  </div>

                  {/* Training count */}
                  <p className="text-[11px] text-neutral-500">
                    {belt.trainings_since_promotion} trainingen sinds laatste promotie
                    {belt.training_count ? ` (${belt.training_count} totaal)` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award size={32} className="text-neutral-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-neutral-500">Geen gordels geregistreerd</p>
            <button
              onClick={() => setIsAddBeltModalOpen(true)}
              className="mt-4 text-[13px] text-amber-300 hover:text-amber-200"
            >
              Eerste gordel toevoegen
            </button>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {selectedBelt && (
        <BeltPromotionModal
          isOpen={isPromotionModalOpen}
          onClose={() => {
            setIsPromotionModalOpen(false)
            setSelectedDisciplineId(null)
          }}
          memberId={memberId}
          memberName={memberName}
          currentBelt={selectedBelt}
        />
      )}

      {/* Add Belt Modal */}
      <AddBeltModal
        isOpen={isAddBeltModalOpen}
        onClose={() => setIsAddBeltModalOpen(false)}
        memberId={memberId}
        existingDisciplineIds={belts?.map((b) => b.discipline_id) || []}
      />

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          setSelectedDisciplineId(null)
        }}
        title="Promotie Geschiedenis"
        size="md"
      >
        {history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border border-white/20 ${
                      BELT_COLORS[h.to_belt] || 'bg-gray-500'
                    }`}
                  />
                  <span className="text-[14px] text-neutral-50 capitalize">
                    {h.from_belt ? `${h.from_belt} → ` : ''}{h.to_belt}
                    {h.to_stripes ? ` ${h.to_stripes} stripes` : ''}
                  </span>
                </div>
                <div className="text-[12px] text-neutral-500 space-y-1">
                  <p>{new Date(h.promoted_at!).toLocaleDateString('nl-BE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                  <p>{h.trainings_at_promotion} trainingen op moment van promotie</p>
                  {h.promoter && (
                    <p>Door: {h.promoter.first_name} {h.promoter.last_name}</p>
                  )}
                  {h.notes && <p className="italic">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-neutral-500 text-center py-8">
            Geen promotie geschiedenis
          </p>
        )}
      </Modal>
    </>
  )
}
