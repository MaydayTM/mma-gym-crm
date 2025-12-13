import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Ticket, CreditCard } from 'lucide-react'
import { useOneTimeProducts, useDeleteOneTimeProduct, OneTimeProduct } from '../../hooks/useSubscriptionAdmin'
import { OneTimeProductModal } from './OneTimeProductModal'

export function OneTimeProductsTab() {
  const { data: products, isLoading } = useOneTimeProducts()
  const deleteProduct = useDeleteOneTimeProduct()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  const dayPasses = products?.filter(p => p.product_type === 'daypass') || []
  const punchCards = products?.filter(p => p.product_type === 'punch_card') || []

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return
    await deleteProduct.mutateAsync(id)
  }

  const ProductRow = ({ product }: { product: OneTimeProduct }) => (
    <tr className="hover:bg-white/5 transition">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            product.product_type === 'daypass'
              ? 'bg-purple-500/10'
              : 'bg-emerald-500/10'
          }`}>
            {product.product_type === 'daypass' ? (
              <Ticket size={18} className="text-purple-300" />
            ) : (
              <CreditCard size={18} className="text-emerald-300" />
            )}
          </div>
          <div>
            <p className="text-[14px] font-medium text-neutral-200">{product.name}</p>
            {product.description && (
              <p className="text-[12px] text-neutral-500">{product.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-[14px] font-medium text-neutral-50">
        €{product.price.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-center text-[14px] text-neutral-400">
        {product.sessions || '-'}
      </td>
      <td className="px-4 py-3 text-center text-[14px] text-neutral-400">
        {product.validity_days === 1 ? '1 dag' : `${product.validity_days} dagen`}
      </td>
      <td className="px-4 py-3 text-center">
        {product.show_on_checkout !== false ? (
          <Eye size={16} className="inline text-emerald-400" />
        ) : (
          <EyeOff size={16} className="inline text-neutral-600" />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditingItem(product.id)
              setShowModal(true)
            }}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(product.id)}
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-50">Dagpassen & Beurtenkaarten</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Eenmalige producten voor proefles of losse beurten
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
          Nieuw Product
        </button>
      </div>

      {/* Dagpassen */}
      <div className="space-y-3">
        <h3 className="text-[16px] font-medium text-neutral-200 flex items-center gap-2">
          <Ticket size={18} className="text-purple-300" />
          Dagpassen
        </h3>

        {dayPasses.length === 0 ? (
          <p className="text-[13px] text-neutral-500 py-4">Geen dagpassen</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Prijs
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Sessies
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Geldigheid
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
                {dayPasses.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Beurtenkaarten */}
      <div className="space-y-3">
        <h3 className="text-[16px] font-medium text-neutral-200 flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-300" />
          Beurtenkaarten
        </h3>

        {punchCards.length === 0 ? (
          <p className="text-[13px] text-neutral-500 py-4">Geen beurtenkaarten</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Prijs
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Sessies
                  </th>
                  <th className="text-center px-4 py-3 text-[12px] font-medium text-neutral-500 uppercase tracking-wider">
                    Geldigheid
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
                {punchCards.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <OneTimeProductModal
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
