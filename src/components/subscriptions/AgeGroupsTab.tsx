import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import { useAgeGroups, useDeleteAgeGroup } from '../../hooks/useSubscriptionAdmin'
import { AgeGroupModal } from './AgeGroupModal'

export function AgeGroupsTab() {
  const { data: ageGroups, isLoading } = useAgeGroups()
  const deleteAgeGroup = useDeleteAgeGroup()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze groep wilt verwijderen? Dit verwijdert ook alle gekoppelde prijzen.')) return
    await deleteAgeGroup.mutateAsync(id)
  }

  const formatAgeRange = (min: number | null, max: number | null) => {
    if (min === 0 && max) return `Tot ${max + 1} jaar`
    if (min && max) return `${min}-${max} jaar`
    if (min && !max) return `Vanaf ${min} jaar`
    return 'Alle leeftijden'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Leeftijdsgroepen</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Beheer de categorieën voor prijzen (Kids, Studenten, Volwassenen)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-300 text-neutral-950 text-[14px] font-medium hover:bg-amber-200 transition"
        >
          <Plus size={18} />
          Nieuwe Groep
        </button>
      </div>

      {/* Age Groups Grid */}
      {!ageGroups?.length ? (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <Users className="text-neutral-600 mx-auto mb-3" size={40} />
          <p className="text-[14px] text-neutral-400">Geen leeftijdsgroepen</p>
          <p className="text-[12px] text-neutral-600 mt-1">
            Maak groepen aan om prijzen per leeftijdscategorie te beheren
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ageGroups.map((group) => (
            <div
              key={group.id}
              className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-50">{group.name}</h3>
                  <p className="text-[13px] text-neutral-400">{group.subtitle}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(group.id)
                      setShowModal(true)
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Leeftijd</span>
                  <span className="text-neutral-200">
                    {formatAgeRange(group.min_age, group.max_age)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Startprijs</span>
                  <span className="text-amber-300 font-medium">
                    vanaf €{group.starting_price?.toFixed(0) || '?'}/maand
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Status</span>
                  <span className={`flex items-center gap-1.5 ${
                    group.is_active ? 'text-emerald-400' : 'text-neutral-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      group.is_active ? 'bg-emerald-400' : 'bg-neutral-500'
                    }`} />
                    {group.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[11px] text-neutral-600 font-mono">
                  slug: {group.slug}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AgeGroupModal
          itemId={editingItem}
          onClose={() => {
            setShowModal(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}
