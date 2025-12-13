import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAgeGroups, useCreateAgeGroup, useUpdateAgeGroup } from '../../hooks/useSubscriptionAdmin'

interface AgeGroupModalProps {
  itemId: string | null
  onClose: () => void
}

export function AgeGroupModal({ itemId, onClose }: AgeGroupModalProps) {
  const { data: ageGroups } = useAgeGroups()
  const createAgeGroup = useCreateAgeGroup()
  const updateAgeGroup = useUpdateAgeGroup()

  const existingItem = itemId ? ageGroups?.find(ag => ag.id === itemId) : null

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    subtitle: '',
    min_age: null as number | null,
    max_age: null as number | null,
    starting_price: 0,
    sort_order: 0,
    is_active: true
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        slug: existingItem.slug,
        name: existingItem.name,
        subtitle: existingItem.subtitle || '',
        min_age: existingItem.min_age,
        max_age: existingItem.max_age,
        starting_price: existingItem.starting_price || 0,
        sort_order: existingItem.sort_order,
        is_active: existingItem.is_active
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
      if (itemId) {
        await updateAgeGroup.mutateAsync({ id: itemId, ...formData })
      } else {
        await createAgeGroup.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving age group:', error)
    }
  }

  const isLoading = createAgeGroup.isPending || updateAgeGroup.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {itemId ? 'Groep Bewerken' : 'Nieuwe Leeftijdsgroep'}
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
              placeholder="bijv. Volwassenen"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Subtitel
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="bijv. Vanaf 22 jaar"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Age Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Minimum leeftijd
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_age ?? ''}
                onChange={(e) => setFormData({
                  ...formData,
                  min_age: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
              />
            </div>
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Maximum leeftijd
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_age ?? ''}
                onChange={(e) => setFormData({
                  ...formData,
                  max_age: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="Geen limiet"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
              />
            </div>
          </div>

          {/* Starting Price */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Startprijs (€/maand) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
            />
            <p className="text-[12px] text-neutral-500 mt-1">
              Wordt getoond als "vanaf €X/maand" op de checkout
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
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-300 focus:ring-amber-300/50"
            />
            <span className="text-[14px] text-neutral-200">Actief</span>
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
