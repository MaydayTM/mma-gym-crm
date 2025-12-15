import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ProductWithVariants } from '../../types/shop';

// Default tenant ID for single-tenant setup
const TENANT_ID = 'reconnect-academy';

type ProductFilters = {
  category?: string;
  search?: string;
  featured?: boolean;
  includeInactive?: boolean;
};

// Hook to fetch a single product by slug
export const useProduct = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) {
        console.log('[useProduct] No slug provided');
        return null;
      }

      console.log('[useProduct] Fetching product with slug:', slug, 'tenant:', TENANT_ID);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('tenant_id', TENANT_ID)
        .eq('seo_slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('[useProduct] Error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          // Not found - let's check if product exists but is inactive
          const { data: anyProduct } = await supabase
            .from('products')
            .select('id, seo_slug, is_active, tenant_id')
            .eq('seo_slug', slug)
            .single();

          if (anyProduct) {
            console.log('[useProduct] Product exists but filtered out:', anyProduct);
          } else {
            console.log('[useProduct] Product not found with slug:', slug);
          }
          return null;
        }
        throw error;
      }

      console.log('[useProduct] Found product:', data?.name);

      // Filter active variants
      const product = data as ProductWithVariants;
      product.variants = product.variants.filter(v => v.is_active);

      return product;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('tenant_id', TENANT_ID)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Only filter by is_active when includeInactive is false
      if (!filters.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters.search) {
        // Escape SQL wildcards to prevent unintended pattern matching
        const escapedSearch = filters.search.replace(/[%_]/g, '\\$&');
        query = query.or(`name.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter active variants for all products (unless including inactive)
      const products = data as ProductWithVariants[];
      if (!filters.includeInactive) {
        products.forEach(product => {
          product.variants = product.variants.filter(v => v.is_active);
        });
      }

      return products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
