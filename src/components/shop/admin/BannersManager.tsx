import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Image,
  Upload,
  Trash2,
  Edit2,
  Plus,
  Info,
  Calendar,
  Eye,
  EyeOff,
  X,
  Save,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { BANNER_SIZES, type BannerType, type ShopBanner } from '../../../hooks/shop/useShopBanners'

const TENANT_ID = 'reconnect'

const BANNER_TYPE_LABELS: Record<BannerType, { label: string; description: string }> = {
  hero: {
    label: 'Hero Banner',
    description: 'Hoofdbanner bovenaan de shop pagina',
  },
  promo: {
    label: 'Promo Banner',
    description: 'Seizoens- of campagne banner tussen secties',
  },
  category: {
    label: 'Categorie Banners',
    description: 'Afbeeldingen voor Kleding, Gear en Accessoires',
  },
  spotlight: {
    label: 'Spotlight Banner',
    description: 'Featured product of custom gear sectie',
  },
}

export function BannersManager() {
  const [editingBanner, setEditingBanner] = useState<ShopBanner | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newBannerType, setNewBannerType] = useState<BannerType>('hero')
  const queryClient = useQueryClient()

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-shop-banners', TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_banners')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('type')
        .order('position')

      if (error) throw error
      return data as ShopBanner[]
    },
  })

  const updateBanner = useMutation({
    mutationFn: async (banner: Partial<ShopBanner> & { id: string }) => {
      const { id, ...updates } = banner
      const { error } = await supabase
        .from('shop_banners')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-banners'] })
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] })
      setEditingBanner(null)
    },
  })

  const createBanner = useMutation({
    mutationFn: async (banner: Omit<ShopBanner, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('shop_banners')
        .insert(banner)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-banners'] })
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] })
      setIsCreating(false)
    },
  })

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shop_banners')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-banners'] })
      queryClient.invalidateQueries({ queryKey: ['shop-banners'] })
    },
  })

  const toggleActive = async (banner: ShopBanner) => {
    await updateBanner.mutateAsync({
      id: banner.id,
      is_active: !banner.is_active,
    })
  }

  // Group banners by type
  const groupedBanners = banners?.reduce((acc, banner) => {
    if (!acc[banner.type]) acc[banner.type] = []
    acc[banner.type].push(banner)
    return acc
  }, {} as Record<BannerType, ShopBanner[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Shop Banners</h3>
          <p className="text-sm text-neutral-400">
            Beheer de afbeeldingen en teksten op je shop pagina
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Banner</span>
        </button>
      </div>

      {/* Image Size Guidelines */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Optimale afbeeldingsformaten</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(Object.keys(BANNER_SIZES) as BannerType[]).map(type => (
                <div key={type} className="text-neutral-300">
                  <span className="font-medium text-white capitalize">{type}:</span>
                  <br />
                  {BANNER_SIZES[type].desktop.width}×{BANNER_SIZES[type].desktop.height}px
                  <br />
                  <span className="text-neutral-500">Max: {BANNER_SIZES[type].maxSize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banner Groups */}
      {(Object.keys(BANNER_TYPE_LABELS) as BannerType[]).map(type => (
        <div key={type} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white">{BANNER_TYPE_LABELS[type].label}</h4>
              <p className="text-sm text-neutral-400">{BANNER_TYPE_LABELS[type].description}</p>
            </div>
            <div className="text-sm text-neutral-500">
              {BANNER_SIZES[type].desktop.width}×{BANNER_SIZES[type].desktop.height}px
            </div>
          </div>

          {groupedBanners?.[type]?.length ? (
            <div className="space-y-3">
              {groupedBanners[type].map(banner => (
                <BannerCard
                  key={banner.id}
                  banner={banner}
                  onEdit={() => setEditingBanner(banner)}
                  onToggleActive={() => toggleActive(banner)}
                  onDelete={() => {
                    if (confirm('Weet je zeker dat je deze banner wilt verwijderen?')) {
                      deleteBanner.mutate(banner.id)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Geen {BANNER_TYPE_LABELS[type].label.toLowerCase()} geconfigureerd</p>
              <button
                onClick={() => {
                  setNewBannerType(type)
                  setIsCreating(true)
                }}
                className="mt-3 text-amber-400 hover:text-amber-300 text-sm"
              >
                + Voeg toe
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editingBanner && (
        <BannerEditModal
          banner={editingBanner}
          onClose={() => setEditingBanner(null)}
          onSave={(updates) => updateBanner.mutate({ id: editingBanner.id, ...updates })}
          isSaving={updateBanner.isPending}
        />
      )}

      {/* Create Modal */}
      {isCreating && (
        <BannerCreateModal
          type={newBannerType}
          onTypeChange={setNewBannerType}
          onClose={() => setIsCreating(false)}
          onCreate={(banner) => createBanner.mutate(banner)}
          isCreating={createBanner.isPending}
        />
      )}
    </div>
  )
}

function BannerCard({
  banner,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  banner: ShopBanner
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}) {
  const isScheduled = banner.starts_at || banner.ends_at

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${
      banner.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'
    }`}>
      {/* Thumbnail */}
      <div className="w-24 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-6 h-6 text-neutral-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-medium text-white truncate">{banner.title}</h5>
          {banner.slug && (
            <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 text-xs rounded">
              {banner.slug}
            </span>
          )}
          {isScheduled && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
              <Calendar className="w-3 h-3" />
              Gepland
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-400 truncate">{banner.subtitle || 'Geen subtitel'}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleActive}
          className={`p-2 rounded-lg transition-colors ${
            banner.is_active
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10'
          }`}
          title={banner.is_active ? 'Deactiveren' : 'Activeren'}
        >
          {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onEdit}
          className="p-2 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Bewerken"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface BannerEditModalProps {
  banner: ShopBanner
  onClose: () => void
  onSave: (updates: Partial<ShopBanner>) => void
  isSaving: boolean
}

function BannerEditModal({ banner, onClose, onSave, isSaving }: BannerEditModalProps) {
  const [formData, setFormData] = useState({
    title: banner.title,
    subtitle: banner.subtitle || '',
    badge_text: banner.badge_text || '',
    cta_text: banner.cta_text || '',
    cta_link: banner.cta_link || '',
    image_url: banner.image_url,
    image_url_mobile: banner.image_url_mobile || '',
    is_active: banner.is_active,
    starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
    ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      subtitle: formData.subtitle || null,
      badge_text: formData.badge_text || null,
      cta_text: formData.cta_text || null,
      cta_link: formData.cta_link || null,
      image_url_mobile: formData.image_url_mobile || null,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    })
  }

  const sizeInfo = BANNER_SIZES[banner.type]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Banner Bewerken</h3>
            <p className="text-sm text-neutral-400">
              {BANNER_TYPE_LABELS[banner.type].label}
              {banner.slug && ` - ${banner.slug}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Size Hint */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
            <strong>Optimaal formaat:</strong> {sizeInfo.desktop.width}×{sizeInfo.desktop.height}px (desktop),{' '}
            {sizeInfo.mobile.width}×{sizeInfo.mobile.height}px (mobiel). Max: {sizeInfo.maxSize}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Subtitel</label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Badge Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Badge tekst</label>
            <input
              type="text"
              value={formData.badge_text}
              onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
              placeholder="bijv. NEW COLLECTION, SALE, PRE-ORDER"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Afbeelding URL (Desktop) *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                required
                placeholder="https://..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <button
                type="button"
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Upload (binnenkort beschikbaar)"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Image URL */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Afbeelding URL (Mobiel) - Optioneel
            </label>
            <input
              type="url"
              value={formData.image_url_mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url_mobile: e.target.value }))}
              placeholder="https://... (laat leeg voor dezelfde als desktop)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Button tekst</label>
              <input
                type="text"
                value={formData.cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                placeholder="bijv. Shop Now"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Button link</label>
              <input
                type="text"
                value={formData.cta_link}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_link: e.target.value }))}
                placeholder="/shop/products"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Start datum (optioneel)
              </label>
              <input
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Eind datum (optioneel)
              </label>
              <input
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400"
            />
            <span className="text-white">Banner is actief</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Opslaan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface BannerCreateModalProps {
  type: BannerType
  onTypeChange: (type: BannerType) => void
  onClose: () => void
  onCreate: (banner: Omit<ShopBanner, 'id' | 'created_at' | 'updated_at'>) => void
  isCreating: boolean
}

function BannerCreateModal({ type, onTypeChange, onClose, onCreate, isCreating }: BannerCreateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    cta_text: '',
    cta_link: '',
    image_url: '',
    slug: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      tenant_id: TENANT_ID,
      type,
      slug: formData.slug || null,
      title: formData.title,
      subtitle: formData.subtitle || null,
      badge_text: formData.badge_text || null,
      cta_text: formData.cta_text || null,
      cta_link: formData.cta_link || null,
      image_url: formData.image_url,
      image_url_mobile: null,
      image_alt: formData.title,
      background_color: '#1a1a1a',
      text_color: '#ffffff',
      overlay_opacity: 50,
      position: 1,
      is_active: true,
      starts_at: null,
      ends_at: null,
    })
  }

  const sizeInfo = BANNER_SIZES[type]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Nieuwe Banner</h3>
            <p className="text-sm text-neutral-400">Voeg een nieuwe banner toe aan je shop</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Banner Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Banner Type *</label>
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as BannerType)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              {(Object.keys(BANNER_TYPE_LABELS) as BannerType[]).map(t => (
                <option key={t} value={t}>
                  {BANNER_TYPE_LABELS[t].label}
                </option>
              ))}
            </select>
          </div>

          {/* Image Size Hint */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
            <strong>Optimaal formaat:</strong> {sizeInfo.desktop.width}×{sizeInfo.desktop.height}px. Max: {sizeInfo.maxSize}
          </div>

          {/* Slug for category type */}
          {type === 'category' && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Categorie Slug *</label>
              <select
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="">Selecteer categorie...</option>
                <option value="clothing">Kleding</option>
                <option value="gear">Fight Gear</option>
                <option value="accessories">Accessoires</option>
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Subtitel</label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Afbeelding URL *</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              required
              placeholder="https://..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Aanmaken</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BannersManager
