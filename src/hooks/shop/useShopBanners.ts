import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// Note: shop_banners is in the main CRM database, not the shop database
const TENANT_ID = 'reconnect'

export type BannerType = 'hero' | 'promo' | 'category' | 'spotlight'

/**
 * Shop Banner Configuration
 *
 * Optimale afbeeldingsformaten:
 *
 * | Type       | Desktop        | Mobiel         | Ratio  | Max Size |
 * |------------|----------------|----------------|--------|----------|
 * | hero       | 1920×600 px    | 768×500 px     | 16:5   | 2MB      |
 * | promo      | 1920×400 px    | 768×300 px     | ~5:1   | 2MB      |
 * | category   | 800×1000 px    | 400×500 px     | 4:5    | 1MB      |
 * | spotlight  | 800×600 px     | 600×450 px     | 4:3    | 1MB      |
 */
export interface ShopBanner {
  id: string
  tenant_id: string
  type: BannerType
  slug: string | null
  title: string
  subtitle: string | null
  badge_text: string | null
  cta_text: string | null
  cta_link: string | null
  image_url: string
  image_url_mobile: string | null
  image_alt: string | null
  background_color: string
  text_color: string
  overlay_opacity: number
  position: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch all banners of a specific type
 */
export function useShopBanners(type?: BannerType) {
  return useQuery({
    queryKey: ['shop-banners', TENANT_ID, type],
    queryFn: async () => {
      let query = supabase
        .from('shop_banners')
        .select('*')
        .eq('tenant_id', TENANT_ID)
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

      // Filter by scheduling client-side (simpler and more reliable)
      const now = new Date()
      const filtered = (data || []).filter(banner => {
        const startsAt = banner.starts_at ? new Date(banner.starts_at) : null
        const endsAt = banner.ends_at ? new Date(banner.ends_at) : null

        // If starts_at is set and is in the future, exclude
        if (startsAt && startsAt > now) return false
        // If ends_at is set and is in the past, exclude
        if (endsAt && endsAt < now) return false

        return true
      })

      return filtered as ShopBanner[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

/**
 * Fetch a single banner by type (returns first active one)
 */
export function useHeroBanner() {
  const { data: banners, ...rest } = useShopBanners('hero')
  return {
    banner: banners?.[0] || null,
    ...rest,
  }
}

/**
 * Fetch promo/campaign banner
 */
export function usePromoBanner() {
  const { data: banners, ...rest } = useShopBanners('promo')
  return {
    banner: banners?.[0] || null,
    ...rest,
  }
}

/**
 * Fetch category banners (clothing, gear, accessories)
 */
export function useCategoryBanners() {
  const { data: banners, ...rest } = useShopBanners('category')

  // Convert to a map by slug for easy access
  const categoryMap = (banners || []).reduce((acc, banner) => {
    if (banner.slug) {
      acc[banner.slug] = banner
    }
    return acc
  }, {} as Record<string, ShopBanner>)

  return {
    banners: banners || [],
    categoryMap,
    getCategory: (slug: string) => categoryMap[slug] || null,
    ...rest,
  }
}

/**
 * Fetch spotlight/feature banner (e.g., Custom Gloves section)
 */
export function useSpotlightBanner(slug?: string) {
  const { data: banners, ...rest } = useShopBanners('spotlight')

  const banner = slug
    ? banners?.find(b => b.slug === slug) || banners?.[0]
    : banners?.[0]

  return {
    banner: banner || null,
    ...rest,
  }
}

/**
 * Banner image size recommendations
 */
export const BANNER_SIZES = {
  hero: {
    desktop: { width: 1920, height: 600 },
    mobile: { width: 768, height: 500 },
    ratio: '16:5',
    maxSize: '2MB',
  },
  promo: {
    desktop: { width: 1920, height: 400 },
    mobile: { width: 768, height: 300 },
    ratio: '~5:1',
    maxSize: '2MB',
  },
  category: {
    desktop: { width: 800, height: 1000 },
    mobile: { width: 400, height: 500 },
    ratio: '4:5',
    maxSize: '1MB',
  },
  spotlight: {
    desktop: { width: 800, height: 600 },
    mobile: { width: 600, height: 450 },
    ratio: '4:3',
    maxSize: '1MB',
  },
} as const
