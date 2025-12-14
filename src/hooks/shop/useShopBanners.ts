import { useQuery } from '@tanstack/react-query'
import { shopSupabase, getShopTenantId } from '../../lib/shopSupabase'

export interface ShopBanner {
  id: string
  tenant_id: string
  type: 'hero' | 'promo' | 'category'
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_link: string | null
  image_url: string
  image_alt: string | null
  background_color: string
  text_color: string
  position: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export function useShopBanners(type?: 'hero' | 'promo' | 'category') {
  const tenantId = getShopTenantId()

  return useQuery({
    queryKey: ['shop-banners', tenantId, type],
    queryFn: async () => {
      if (!shopSupabase || !tenantId) {
        return []
      }

      let query = shopSupabase
        .from('shop_banners')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('position', { ascending: true })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching shop banners:', error)
        return []
      }

      return (data || []) as ShopBanner[]
    },
    enabled: !!shopSupabase && !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useHeroBanner() {
  const { data: banners, ...rest } = useShopBanners('hero')
  return {
    banner: banners?.[0] || null,
    ...rest,
  }
}

export function usePromoBanner() {
  const { data: banners, ...rest } = useShopBanners('promo')
  return {
    banner: banners?.[0] || null,
    ...rest,
  }
}
