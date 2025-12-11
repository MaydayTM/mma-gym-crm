import { useQuery } from '@tanstack/react-query';
import { shopSupabase, getShopTenantId, isShopConfigured } from '../../lib/shopSupabase';
import type { OrderWithItems, OrderStatus } from '../../types/shop';

type OrderFilters = {
  status?: OrderStatus;
};

export const useOrders = (filters: OrderFilters = {}) => {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      if (!isShopConfigured() || !shopSupabase) {
        return [];
      }

      const tenantId = getShopTenantId();

      let query = shopSupabase
        .from('shop_orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as OrderWithItems[];
    },
    enabled: isShopConfigured(),
  });
};
