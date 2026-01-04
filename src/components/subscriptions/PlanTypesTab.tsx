import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { usePlanTypes, useDeletePlanType } from '../../hooks/useSubscriptionAdmin'
import { PlanTypeModal } from './PlanTypeModal'

export function PlanTypesTab() {
  const { data: planTypes, isLoading } = usePlanTypes()
  const deletePlanType = useDeletePlanType()
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
    if (!confirm('Weet je zeker dat je dit type wilt verwijderen? Dit verwijdert ook alle gekoppelde prijzen.')) return
    await deletePlanType.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Abonnement Types</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Beheer de types abonnementen (Basis, All-In, etc.)
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
          Nieuw Type
        </button>
      </div>

      {/* Plan Types Grid */}
      {!planTypes?.length ? (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <Package className="text-neutral-600 mx-auto mb-3" size={40} />
          <p className="text-[14px] text-neutral-400">Geen abonnement types</p>
          <p className="text-[12px] text-neutral-600 mt-1">
            Maak types aan zoals &quot;Basis&quot; of &quot;All-In&quot; om prijzen te kunnen instellen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planTypes.map((planType) => (
            <div
              key={planType.id}
              className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-50">{planType.name}</h3>
                  <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">
                    {planType.description || 'Geen beschrijving'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(planType.id)
                      setShowModal(true)
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(planType.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {planType.highlight_text && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[12px] font-medium">
                    {planType.highlight_text}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Status</span>
                  <span className={`flex items-center gap-1.5 ${
                    planType.is_active ? 'text-emerald-400' : 'text-neutral-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      planType.is_active ? 'bg-emerald-400' : 'bg-neutral-500'
                    }`} />
                    {planType.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Volgorde</span>
                  <span className="text-neutral-200">{planType.sort_order || 0}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[11px] text-neutral-600 font-mono">
                  slug: {planType.slug}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanTypeModal
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
