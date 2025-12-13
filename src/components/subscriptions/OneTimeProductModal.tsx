import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useOneTimeProducts, useCreateOneTimeProduct, useUpdateOneTimeProduct } from '../../hooks/useSubscriptionAdmin'

interface OneTimeProductModalProps {
  itemId: string | null
  onClose: () => void
}

export function OneTimeProductModal({ itemId, onClose }: OneTimeProductModalProps) {
  const { data: products } = useOneTimeProducts()
  const createProduct = useCreateOneTimeProduct()
  const updateProduct = useUpdateOneTimeProduct()

  const existingItem = itemId ? products?.find(p => p.id === itemId) : null

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    product_type: 'daypass' as 'daypass' | 'punch_card',
    price: 0,
    sessions: 1,
    validity_days: 1,
    show_on_checkout: true,
    sort_order: 0
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        slug: existingItem.slug,
        name: existingItem.name,
        description: existingItem.description || '',
        product_type: (existingItem.product_type as 'daypass' | 'punch_card') || 'daypass',
        price: existingItem.price,
        sessions: existingItem.sessions || 1,
        validity_days: existingItem.validity_days,
        show_on_checkout: existingItem.show_on_checkout !== false,
        sort_order: existingItem.sort_order ?? 0
      })
    }
  }, [existingItem])

  // Auto-generate slug from name
  useEffect(() => {
    if (!itemId && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, itemId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        sessions: formData.product_type === 'daypass' ? 1 : formData.sessions
      }

      if (itemId) {
        await updateProduct.mutateAsync({ id: itemId, ...payload })
      } else {
        await createProduct.mutateAsync(payload)
      }
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const isLoading = createProduct.isPending || updateProduct.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {itemId ? 'Product Bewerken' : 'Nieuw Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Type */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, product_type: 'daypass' })}
                className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition ${
                  formData.product_type === 'daypass'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                Dagpas
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, product_type: 'punch_card' })}
                className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition ${
                  formData.product_type === 'punch_card'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                Beurtenkaart
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Naam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="bijv. 5-Beurtenkaart"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              disabled={!!itemId}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-400 focus:outline-none focus:border-amber-300/50 transition disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Korte beschrijving voor checkout"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 resize-none"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Prijs (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            </div>

            {/* Sessions (only for punch_card) */}
            {formData.product_type === 'punch_card' && (
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  Aantal beurten *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sessions}
                  onChange={(e) => setFormData({ ...formData, sessions: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
                />
              </div>
            )}
          </div>

          {/* Validity */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Geldigheid (dagen) *
            </label>
            <input
              type="number"
              min="1"
              value={formData.validity_days}
              onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 1 })}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
            />
            <p className="text-[12px] text-neutral-500 mt-1">
              Na aankoop is het product X dagen geldig
            </p>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Sorteervolgorde
            </label>
            <input
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
            />
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.show_on_checkout}
              onChange={(e) => setFormData({ ...formData, show_on_checkout: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
            />
            <span className="text-[14px] text-neutral-200">Tonen op checkout pagina</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-neutral-400 text-[14px] font-medium hover:bg-white/5 transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-300 text-neutral-950 text-[14px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
