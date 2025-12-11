import React, { useState } from 'react';
import { useOrders } from '../../../hooks/shop/useOrders';
import { shopSupabase } from '../../../lib/shopSupabase';
import type { OrderStatus } from '../../../types/shop';

interface OrderUpdate {
  status: OrderStatus;
  shipped_at?: string;
  cancelled_at?: string;
}

export const OrdersManager: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const { data: orders, isLoading, refetch } = useOrders({
    status: statusFilter || undefined,
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setError(null);
      const updates: OrderUpdate = { status: newStatus };

      if (newStatus === 'shipped' && !orders?.find(o => o.id === orderId)?.shipped_at) {
        updates.shipped_at = new Date().toISOString();
      }

      if (newStatus === 'cancelled' && !orders?.find(o => o.id === orderId)?.cancelled_at) {
        updates.cancelled_at = new Date().toISOString();
      }

      if (!shopSupabase) {
        throw new Error('Shop database niet beschikbaar');
      }

      const { error } = await shopSupabase
        .from('shop_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      refetch();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het bijwerken van de bestelling';
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Laden...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Bestellingen</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
        >
          <option value="" className="bg-gray-900">Alle statussen</option>
          <option value="pending" className="bg-gray-900">In afwachting</option>
          <option value="paid" className="bg-gray-900">Betaald</option>
          <option value="shipped" className="bg-gray-900">Verzonden</option>
          <option value="cancelled" className="bg-gray-900">Geannuleerd</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-400 hover:text-red-300"
            >
              <span className="sr-only">Sluiten</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Bestelnr</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Klant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Totaal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {orders?.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-white">{order.order_number}</td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(order.created_at).toLocaleDateString('nl-BE')}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{order.items.length} items</td>
                <td className="px-4 py-3 text-sm font-medium text-white">€{order.total_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status === 'paid' ? 'Betaald' :
                     order.status === 'shipped' ? 'Verzonden' :
                     order.status === 'cancelled' ? 'Geannuleerd' :
                     'In afwachting'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Markeer verzonden
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Geen bestellingen gevonden
          </div>
        )}
      </div>
    </div>
  );
};
