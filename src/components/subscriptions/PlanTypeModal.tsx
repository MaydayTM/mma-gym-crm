import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { usePlanTypes, useCreatePlanType, useUpdatePlanType } from '../../hooks/useSubscriptionAdmin'

interface PlanTypeModalProps {
  itemId: string | null
  onClose: () => void
}

export function PlanTypeModal({ itemId, onClose }: PlanTypeModalProps) {
  const { data: planTypes } = usePlanTypes()
  const createPlanType = useCreatePlanType()
  const updatePlanType = useUpdatePlanType()

  const existingItem = itemId ? planTypes?.find(pt => pt.id === itemId) : null
  const isEditing = !!existingItem

  const [formData, setFormData] = useState(() => ({
    name: existingItem?.name || '',
    slug: existingItem?.slug || '',
    description: existingItem?.description || '',
    highlight_text: existingItem?.highlight_text || '',
    sort_order: existingItem?.sort_order || 0,
    is_active: existingItem?.is_active ?? true,
    features: Array.isArray(existingItem?.features) ? existingItem.features as string[] : []
  }))

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing && itemId) {
        await updatePlanType.mutateAsync({
          id: itemId,
          ...formData
        })
      } else {
        await createPlanType.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving plan type:', error)
    }
  }

  const isSubmitting = createPlanType.isPending || updatePlanType.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-[18px] font-semibold text-neutral-50">
            {isEditing ? 'Type Bewerken' : 'Nieuw Abonnement Type'}
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="bijv. All-In, Basis, Premium"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Slug (URL-vriendelijk)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="all-in"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 font-mono text-[13px]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Beschrijf wat dit abonnement inhoudt..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 resize-none"
            />
          </div>

          {/* Highlight Text */}
          <div>
            <label className="block text-[13px] text-neutral-400 mb-2">
              Highlight tekst (optioneel)
            </label>
            <input
              type="text"
              value={formData.highlight_text}
              onChange={(e) => setFormData(prev => ({ ...prev, highlight_text: e.target.value }))}
              placeholder="bijv. Meest gekozen, Best value"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600"
            />
          </div>

          {/* Sort Order & Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Volgorde
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
            </div>
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              >
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
              </select>
            </div>
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
              disabled={isSubmitting || !formData.name}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-300 text-neutral-950 text-[14px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Opslaan...
                </>
              ) : (
                isEditing ? 'Opslaan' : 'Aanmaken'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
