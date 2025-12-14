import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { OrderWithItems, OrderStatus } from '../../types/shop';

// Default tenant ID for single-tenant setup
const TENANT_ID = 'reconnect-academy';

type OrderFilters = {
  status?: OrderStatus;
};

export const useOrders = (filters: OrderFilters = {}) => {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('shop_orders')
        .select(`
          *,
          items:shop_order_items(*)
        `)
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as OrderWithItems[];
    },
  });
};
