import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Percent, Users, Tag } from 'lucide-react'
import { useDiscounts, useFamilyDiscounts, useDeleteDiscount } from '../../hooks/useSubscriptionAdmin'
import type { Discount } from '../../hooks/useSubscriptionAdmin'
import { DiscountModal } from './DiscountModal'

export function DiscountsTab() {
  const { data: discounts, isLoading: loadingDiscounts } = useDiscounts()
  const { data: familyDiscounts, isLoading: loadingFamily } = useFamilyDiscounts()
  const deleteDiscount = useDeleteDiscount()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const isLoading = loadingDiscounts || loadingFamily

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze korting wilt verwijderen?')) return
    await deleteDiscount.mutateAsync(id)
  }

  const formatDiscountValue = (discount: Discount) => {
    if (discount.discount_type === 'percentage' && discount.percentage) {
      return `${discount.percentage}%`
    }
    if (discount.amount) {
      return `€${discount.amount.toFixed(2)}`
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Kortingen & Acties</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Beheer kortingen voor checkout en admin toewijzing
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
          Nieuwe Korting
        </button>
      </div>

      {/* Algemene Kortingen */}
      <div className="space-y-3">
        <h3 className="text-[16px] font-medium text-neutral-200 flex items-center gap-2">
          <Percent size={18} className="text-amber-300" />
          Algemene Kortingen
        </h3>

        {!discounts?.length ? (
          <div className="bg-white/5 rounded-xl p-6 text-center">
            <Tag className="text-neutral-600 mx-auto mb-2" size={32} />
            <p className="text-[13px] text-neutral-500">Nog geen kortingen aangemaakt</p>
            <p className="text-[12px] text-neutral-600 mt-1">
              Maak kortingen aan voor studenten, senioren of tijdelijke acties
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Korting
                  </th>
                  <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Waarde
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Verificatie
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Checkout
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Actief
                  </th>
                  <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[14px] font-medium text-neutral-200">{discount.name}</p>
                        {discount.description && (
                          <p className="text-[12px] text-neutral-500">{discount.description}</p>
                        )}
                        {discount.checkout_code && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300">
                            {discount.checkout_code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[14px] font-medium text-emerald-400">
                        -{formatDiscountValue(discount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-medium ${
                        discount.discount_type === 'percentage'
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {discount.discount_type === 'percentage' ? '%' : '€'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {discount.requires_verification ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-amber-500/10 text-amber-300">
                          Vereist
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {discount.show_on_checkout ? (
                        <Eye size={16} className="inline text-emerald-400" />
                      ) : (
                        <EyeOff size={16} className="inline text-neutral-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        discount.is_active ? 'bg-emerald-400' : 'bg-neutral-600'
                      }`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(discount.id)
                            setShowModal(true)
                          }}
                          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
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

      {/* Gezinskorting */}
      <div className="space-y-3">
        <h3 className="text-[16px] font-medium text-neutral-200 flex items-center gap-2">
          <Users size={18} className="text-blue-300" />
          Gezinskorting
        </h3>
        <p className="text-[12px] text-neutral-500">
          Automatische korting gebaseerd op gezinspositie (beheerd via database)
        </p>

        {!familyDiscounts?.length ? (
          <p className="text-[13px] text-neutral-500 py-4">Geen gezinskorting geconfigureerd</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {familyDiscounts.map((fd) => (
              <div
                key={fd.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <p className="text-[13px] text-neutral-400">
                  {fd.position}e gezinslid
                </p>
                <p className="text-[20px] font-bold text-emerald-400 mt-1">
                  -€{fd.discount_amount.toFixed(0)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  per maand
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DiscountModal
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
