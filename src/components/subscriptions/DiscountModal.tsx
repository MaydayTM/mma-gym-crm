import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useDiscounts, useCreateDiscount, useUpdateDiscount } from '../../hooks/useSubscriptionAdmin'

interface DiscountModalProps {
  itemId: string | null
  onClose: () => void
}

export function DiscountModal({ itemId, onClose }: DiscountModalProps) {
  const { data: discounts } = useDiscounts()
  const createDiscount = useCreateDiscount()
  const updateDiscount = useUpdateDiscount()

  const existingItem = itemId ? discounts?.find(d => d.id === itemId) : null

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    discount_type: 'fixed' as 'fixed' | 'percentage',
    amount: 0,
    percentage: 0,
    is_exclusive: false,
    requires_verification: false,
    valid_from: '',
    valid_until: '',
    max_uses: null as number | null,
    show_on_checkout: true,
    checkout_code: '',
    is_active: true,
    sort_order: 0
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        slug: existingItem.slug,
        name: existingItem.name,
        description: existingItem.description || '',
        discount_type: (existingItem.discount_type as 'fixed' | 'percentage') || 'fixed',
        amount: existingItem.amount || 0,
        percentage: existingItem.percentage || 0,
        is_exclusive: existingItem.is_exclusive ?? false,
        requires_verification: existingItem.requires_verification ?? false,
        valid_from: existingItem.valid_from || '',
        valid_until: existingItem.valid_until || '',
        max_uses: existingItem.max_uses,
        show_on_checkout: existingItem.show_on_checkout ?? true,
        checkout_code: existingItem.checkout_code || '',
        is_active: existingItem.is_active ?? true,
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
        amount: formData.discount_type === 'fixed' ? formData.amount : null,
        percentage: formData.discount_type === 'percentage' ? formData.percentage : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        checkout_code: formData.checkout_code || null
      }

      if (itemId) {
        await updateDiscount.mutateAsync({ id: itemId, ...payload })
      } else {
        await createDiscount.mutateAsync(payload)
      }
      onClose()
    } catch (error) {
      console.error('Error saving discount:', error)
    }
  }

  const isLoading = createDiscount.isPending || updateDiscount.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {itemId ? 'Korting Bewerken' : 'Nieuwe Korting'}
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
              placeholder="bijv. Studentenkorting"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
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
              placeholder="Korte beschrijving"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 resize-none"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Type korting *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition ${
                  formData.discount_type === 'fixed'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                Vast bedrag (€)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition ${
                  formData.discount_type === 'percentage'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                }`}
              >
                Percentage (%)
              </button>
            </div>
          </div>

          {/* Amount / Percentage */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              {formData.discount_type === 'fixed' ? 'Bedrag (€) *' : 'Percentage (%) *'}
            </label>
            {formData.discount_type === 'fixed' ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            ) : (
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            )}
          </div>

          {/* Checkout Code */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Kortingscode (optioneel)
            </label>
            <input
              type="text"
              value={formData.checkout_code}
              onChange={(e) => setFormData({ ...formData, checkout_code: e.target.value.toUpperCase() })}
              placeholder="bijv. NIEUW2025"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 font-mono"
            />
            <p className="text-[12px] text-neutral-500 mt-1">
              Klant voert deze code in bij checkout
            </p>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Geldig vanaf
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            </div>
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Geldig tot
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_checkout}
                onChange={(e) => setFormData({ ...formData, show_on_checkout: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <div>
                <span className="text-[14px] text-neutral-200">Tonen op checkout</span>
                <p className="text-[12px] text-neutral-500">Klant kan korting zelf selecteren</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_verification}
                onChange={(e) => setFormData({ ...formData, requires_verification: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <div>
                <span className="text-[14px] text-neutral-200">Verificatie vereist</span>
                <p className="text-[12px] text-neutral-500">Admin moet goedkeuren (bijv. studentenkaart)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_exclusive}
                onChange={(e) => setFormData({ ...formData, is_exclusive: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <div>
                <span className="text-[14px] text-neutral-200">Exclusief</span>
                <p className="text-[12px] text-neutral-500">Kan niet gecombineerd worden met andere kortingen</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <span className="text-[14px] text-neutral-200">Actief</span>
            </label>
          </div>

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
