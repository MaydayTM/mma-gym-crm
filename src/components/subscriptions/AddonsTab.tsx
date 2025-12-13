import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Shield, Package } from 'lucide-react'
import { usePlanAddons, useDeletePlanAddon } from '../../hooks/useSubscriptionAdmin'
import { AddonModal } from './AddonModal'

export function AddonsTab() {
  const { data: addons, isLoading } = usePlanAddons()
  const deleteAddon = useDeletePlanAddon()
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
    if (!confirm('Weet je zeker dat je deze add-on wilt verwijderen?')) return
    await deleteAddon.mutateAsync(id)
  }

  const getBillingLabel = (type: string) => {
    switch (type) {
      case 'yearly': return '/jaar'
      case 'monthly': return '/maand'
      case 'once': return 'eenmalig'
      default: return type
    }
  }

  const getApplicableLabel = (applicable_to: string[] | null) => {
    if (!applicable_to || applicable_to.length === 0) return 'Alles'
    return applicable_to.map(a => {
      if (a === 'subscription') return 'Abonnementen'
      if (a === 'daypass') return 'Dagpassen'
      if (a === 'punch_card') return 'Beurtenkaarten'
      return a
    }).join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Add-ons</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Extra opties die klanten kunnen toevoegen (verzekering, materiaalhuur)
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
          Nieuwe Add-on
        </button>
      </div>

      {/* Addons List */}
      {!addons?.length ? (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <Package className="text-neutral-600 mx-auto mb-3" size={40} />
          <p className="text-[14px] text-neutral-400">Geen add-ons</p>
          <p className="text-[12px] text-neutral-600 mt-1">
            Voeg extra opties toe zoals verzekering of materiaalhuur
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    addon.slug === 'insurance'
                      ? 'bg-emerald-500/10'
                      : 'bg-blue-500/10'
                  }`}>
                    {addon.slug === 'insurance' ? (
                      <Shield size={20} className="text-emerald-300" />
                    ) : (
                      <Package size={20} className="text-blue-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-neutral-50">{addon.name}</h3>
                    {addon.description && (
                      <p className="text-[12px] text-neutral-500">{addon.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(addon.id)
                      setShowModal(true)
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(addon.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Prijs</span>
                  <span className="text-amber-300 font-medium">
                    €{addon.price.toFixed(2)} {getBillingLabel(addon.billing_type)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Beschikbaar voor</span>
                  <span className="text-neutral-200">
                    {getApplicableLabel(Array.isArray(addon.applicable_to) ? addon.applicable_to : null)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">Status</span>
                  <span className={`flex items-center gap-1.5 ${
                    addon.is_active ? 'text-emerald-400' : 'text-neutral-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      addon.is_active ? 'bg-emerald-400' : 'bg-neutral-500'
                    }`} />
                    {addon.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
                {addon.is_required && (
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-amber-500/10 text-amber-300">
                      Verplicht (bij wedstrijden)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddonModal
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
