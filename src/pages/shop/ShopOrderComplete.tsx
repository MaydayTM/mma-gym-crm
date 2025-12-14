import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Package, Truck, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface OrderDetails {
  order_number: string
  customer_name: string
  customer_email: string
  delivery_method: 'pickup' | 'shipping' | null
  total_amount: number
  status: string
  created_at: string | null
}

export function ShopOrderComplete() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setError('Bestelling niet gevonden')
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('shop_orders')
          .select('order_number, customer_name, customer_email, delivery_method, total_amount, status, created_at')
          .eq('order_number', orderNumber)
          .single()

        if (fetchError || !data) {
          setError('Bestelling niet gevonden')
        } else {
          setOrder(data as OrderDetails)
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Er ging iets mis bij het ophalen van je bestelling')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-amber-400 animate-spin mb-4" />
          <p className="text-neutral-400">Bestelling laden...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Oeps!</h1>
          <p className="text-neutral-400 mb-6">{error || 'Bestelling niet gevonden'}</p>
          <Link
            to="/shop/products"
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition inline-block"
          >
            Terug naar shop
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.status === 'paid'
  const isCancelled = order.status === 'cancelled'
  const isPending = order.status === 'pending'

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-950 rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Status Icon */}
        {isPaid && (
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
        )}
        {isCancelled && (
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-400" />
          </div>
        )}
        {isPending && (
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 size={40} className="text-amber-400 animate-spin" />
          </div>
        )}

        {/* Status Message */}
        {isPaid && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Bedankt voor je bestelling!</h1>
            <p className="text-neutral-400 mb-6">
              Je betaling is ontvangen. We gaan direct aan de slag met je bestelling.
            </p>
          </>
        )}
        {isCancelled && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Betaling geannuleerd</h1>
            <p className="text-neutral-400 mb-6">
              Je betaling is niet voltooid. Je kunt het opnieuw proberen.
            </p>
          </>
        )}
        {isPending && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Betaling verwerken...</h1>
            <p className="text-neutral-400 mb-6">
              We wachten nog op bevestiging van je betaling. Dit kan enkele minuten duren.
            </p>
          </>
        )}

        {/* Order Details */}
        <div className="bg-neutral-800 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-neutral-500" />
            <span className="font-medium text-white">Bestelling #{order.order_number}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Naam</span>
              <span className="text-white">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Email</span>
              <span className="text-white">{order.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Levering</span>
              <span className="text-white flex items-center gap-1">
                {order.delivery_method === 'pickup' ? (
                  <>
                    <Store size={14} />
                    Ophalen
                  </>
                ) : (
                  <>
                    <Truck size={14} />
                    Verzenden
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-neutral-700">
              <span className="text-white">Totaal</span>
              <span className="text-amber-400">€{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        {isPaid && order.delivery_method === 'pickup' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-amber-400">
              <strong>Ophalen bij:</strong><br />
              Reconnect Academy<br />
              Erembodegemstraat 31, 9300 Aalst<br /><br />
              We sturen je een email wanneer je bestelling klaar ligt.
            </p>
          </div>
        )}

        {isPaid && order.delivery_method === 'shipping' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-400">
              <strong>Verzending:</strong><br />
              Je ontvangt een email met tracking informatie zodra je pakket onderweg is.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/shop/products"
            className="block w-full px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition"
          >
            Verder winkelen
          </Link>

          {isCancelled && (
            <Link
              to="/shop/checkout"
              className="block w-full px-6 py-3 border border-neutral-600 text-white font-medium rounded-lg hover:bg-neutral-800 transition"
            >
              Opnieuw proberen
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopOrderComplete
