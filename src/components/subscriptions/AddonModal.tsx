import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { usePlanAddons, useCreatePlanAddon, useUpdatePlanAddon } from '../../hooks/useSubscriptionAdmin'

interface AddonModalProps {
  itemId: string | null
  onClose: () => void
}

export function AddonModal({ itemId, onClose }: AddonModalProps) {
  const { data: addons } = usePlanAddons()
  const createAddon = useCreatePlanAddon()
  const updateAddon = useUpdatePlanAddon()

  const existingItem = itemId ? addons?.find(a => a.id === itemId) : null

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    price: 0,
    billing_type: 'yearly' as 'yearly' | 'monthly' | 'once',
    applicable_to: [] as string[],
    is_required: false,
    sort_order: 0
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        slug: existingItem.slug,
        name: existingItem.name,
        description: existingItem.description || '',
        price: existingItem.price,
        billing_type: (existingItem.billing_type as 'yearly' | 'monthly' | 'once') || 'yearly',
        applicable_to: Array.isArray(existingItem.applicable_to) ? existingItem.applicable_to : [],
        is_required: existingItem.is_required ?? false,
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

  const toggleApplicableTo = (value: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_to: prev.applicable_to.includes(value)
        ? prev.applicable_to.filter(v => v !== value)
        : [...prev.applicable_to, value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        applicable_to: formData.applicable_to.length > 0 ? formData.applicable_to : null
      }

      if (itemId) {
        await updateAddon.mutateAsync({ id: itemId, ...payload })
      } else {
        await createAddon.mutateAsync(payload)
      }
      onClose()
    } catch (error) {
      console.error('Error saving addon:', error)
    }
  }

  const isLoading = createAddon.isPending || updateAddon.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {itemId ? 'Add-on Bewerken' : 'Nieuwe Add-on'}
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
              placeholder="bijv. Sportverzekering"
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
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Facturatie *
              </label>
              <select
                value={formData.billing_type}
                onChange={(e) => setFormData({ ...formData, billing_type: e.target.value as 'yearly' | 'monthly' | 'once' })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              >
                <option value="yearly">Per jaar</option>
                <option value="monthly">Per maand</option>
                <option value="once">Eenmalig</option>
              </select>
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Beschikbaar voor
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'subscription', label: 'Abonnementen' },
                { value: 'daypass', label: 'Dagpassen' },
                { value: 'punch_card', label: 'Beurtenkaarten' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleApplicableTo(option.value)}
                  className={`px-4 py-2 rounded-xl border text-[13px] font-medium transition ${
                    formData.applicable_to.includes(option.value)
                      ? 'bg-amber-300/20 border-amber-300/50 text-amber-300'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-neutral-500 mt-2">
              Laat leeg om voor alle producttypes beschikbaar te maken
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
              checked={formData.is_required}
              onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
            />
            <div>
              <span className="text-[14px] text-neutral-200">Verplicht</span>
              <p className="text-[12px] text-neutral-500">Bijv. verzekering verplicht bij wedstrijden</p>
            </div>
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
