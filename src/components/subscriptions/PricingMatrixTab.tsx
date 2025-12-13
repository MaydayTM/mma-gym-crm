import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { usePricingMatrix, useAgeGroups, usePlanTypes } from '../../hooks/useSubscriptionAdmin'
import { PricingMatrixModal } from './PricingMatrixModal'

export function PricingMatrixTab() {
  const { data: pricing, isLoading } = usePricingMatrix()
  const { data: ageGroups } = useAgeGroups()
  const { data: planTypes } = usePlanTypes()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  // Group pricing by age group
  const pricingByAgeGroup = ageGroups?.map(ag => ({
    ageGroup: ag,
    items: pricing?.filter(p => p.age_group_id === ag.id) || []
  })) || []

  const getDurationLabel = (months: number) => {
    if (months === 1) return '1 maand'
    if (months === 3) return '3 maanden'
    if (months === 12) return '1 jaar'
    return `${months} maanden`
  }

  const getPlanTypeName = (planTypeId: string) => {
    return planTypes?.find(pt => pt.id === planTypeId)?.name || '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Abonnementen & Prijzen</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Beheer prijzen per leeftijdsgroep, type en looptijd
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
          Nieuwe Prijs
        </button>
      </div>

      {/* Pricing by Age Group */}
      {pricingByAgeGroup.map(({ ageGroup, items }) => (
        <div key={ageGroup.id} className="space-y-3">
          <h3 className="text-[16px] font-medium text-neutral-200 flex items-center gap-2">
            {ageGroup.name}
            <span className="text-[12px] text-neutral-500 font-normal">
              {ageGroup.subtitle}
            </span>
          </h3>

          {items.length === 0 ? (
            <p className="text-[13px] text-neutral-500 py-4">
              Geen prijzen voor deze groep
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Looptijd
                    </th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Prijs
                    </th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Per maand
                    </th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Besparing
                    </th>
                    <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Checkout
                    </th>
                    <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items
                    .sort((a, b) => {
                      // Sort by plan type first, then by duration
                      const planTypeSort = (planTypes?.findIndex(pt => pt.id === a.plan_type_id) || 0) -
                                          (planTypes?.findIndex(pt => pt.id === b.plan_type_id) || 0)
                      if (planTypeSort !== 0) return planTypeSort
                      return a.duration_months - b.duration_months
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-medium ${
                            getPlanTypeName(item.plan_type_id) === 'All-In'
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-blue-500/10 text-blue-300'
                          }`}>
                            {getPlanTypeName(item.plan_type_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[14px] text-neutral-200">
                          {getDurationLabel(item.duration_months)}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] font-medium text-neutral-50">
                          €{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] text-neutral-400">
                          €{item.price_per_month?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.savings > 0 ? (
                            <span className="text-[13px] text-emerald-400">
                              -€{item.savings.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-[13px] text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.show_on_checkout !== false ? (
                            <Eye size={16} className="inline text-emerald-400" />
                          ) : (
                            <EyeOff size={16} className="inline text-neutral-600" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(item.id)
                                setShowModal(true)
                              }}
                              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <PricingMatrixModal
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
