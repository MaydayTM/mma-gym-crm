import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAgeGroups, usePlanTypes, usePricingMatrix, useCreatePricing, useUpdatePricing } from '../../hooks/useSubscriptionAdmin'

interface PricingMatrixModalProps {
  itemId: string | null
  onClose: () => void
}

export function PricingMatrixModal({ itemId, onClose }: PricingMatrixModalProps) {
  const { data: pricing } = usePricingMatrix()
  const { data: ageGroups } = useAgeGroups()
  const { data: planTypes } = usePlanTypes()
  const createPricing = useCreatePricing()
  const updatePricing = useUpdatePricing()

  const existingItem = itemId ? pricing?.find(p => p.id === itemId) : null

  const [formData, setFormData] = useState({
    age_group_id: '',
    plan_type_id: '',
    duration_months: 1,
    price: 0,
    price_per_month: 0,
    savings: 0,
    includes_insurance: false,
    show_on_checkout: true,
    highlight_text: ''
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        age_group_id: existingItem.age_group_id,
        plan_type_id: existingItem.plan_type_id,
        duration_months: existingItem.duration_months,
        price: existingItem.price,
        price_per_month: existingItem.price_per_month || 0,
        savings: existingItem.savings || 0,
        includes_insurance: existingItem.includes_insurance || false,
        show_on_checkout: existingItem.show_on_checkout !== false,
        highlight_text: existingItem.highlight_text || ''
      })
    }
  }, [existingItem])

  // Auto-calculate price per month when price or duration changes
  useEffect(() => {
    if (formData.price > 0 && formData.duration_months > 0) {
      const perMonth = formData.price / formData.duration_months
      setFormData(prev => ({ ...prev, price_per_month: Math.round(perMonth * 100) / 100 }))
    }
  }, [formData.price, formData.duration_months])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (itemId) {
        await updatePricing.mutateAsync({ id: itemId, ...formData })
      } else {
        await createPricing.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving pricing:', error)
    }
  }

  const isLoading = createPricing.isPending || updatePricing.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {itemId ? 'Prijs Bewerken' : 'Nieuwe Prijs'}
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
          {/* Age Group */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Leeftijdsgroep *
            </label>
            <select
              value={formData.age_group_id}
              onChange={(e) => setFormData({ ...formData, age_group_id: e.target.value })}
              required
              disabled={!!itemId}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition disabled:opacity-50"
            >
              <option value="">Selecteer groep</option>
              {ageGroups?.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.subtitle})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Type */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Type *
            </label>
            <select
              value={formData.plan_type_id}
              onChange={(e) => setFormData({ ...formData, plan_type_id: e.target.value })}
              required
              disabled={!!itemId}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition disabled:opacity-50"
            >
              <option value="">Selecteer type</option>
              {planTypes?.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Looptijd *
            </label>
            <select
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
              required
              disabled={!!itemId}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition disabled:opacity-50"
            >
              <option value={1}>1 maand</option>
              <option value={3}>3 maanden</option>
              <option value={6}>6 maanden</option>
              <option value={12}>1 jaar</option>
            </select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Totaalprijs (€) *
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
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Per maand (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_month}
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Savings */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Besparing (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.savings}
              onChange={(e) => setFormData({ ...formData, savings: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
            <p className="text-[12px] text-neutral-500 mt-1">
              Wordt getoond als "Bespaar €X" in checkout
            </p>
          </div>

          {/* Highlight Text */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Highlight tekst
            </label>
            <input
              type="text"
              value={formData.highlight_text}
              onChange={(e) => setFormData({ ...formData, highlight_text: e.target.value })}
              placeholder="bijv. POPULAIR of BESTE DEAL"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includes_insurance}
                onChange={(e) => setFormData({ ...formData, includes_insurance: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <span className="text-[14px] text-neutral-200">Inclusief verzekering</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_on_checkout}
                onChange={(e) => setFormData({ ...formData, show_on_checkout: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
              />
              <span className="text-[14px] text-neutral-200">Tonen op checkout pagina</span>
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
