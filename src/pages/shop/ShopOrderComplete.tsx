import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Package, Truck, Store } from 'lucide-react'
import { shopSupabase } from '../../lib/shopSupabase'

interface OrderDetails {
  order_number: string
  customer_name: string
  customer_email: string
  delivery_method: 'pickup' | 'shipping'
  total_amount: number
  status: string
  created_at: string
}

export function ShopOrderComplete() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderNumber = searchParams.get('order')

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber || !shopSupabase) {
        setError('Bestelling niet gevonden')
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await shopSupabase
          .from('shop_orders')
          .select('order_number, customer_name, customer_email, delivery_method, total_amount, status, created_at')
          .eq('order_number', orderNumber)
          .single()

        if (fetchError || !data) {
          setError('Bestelling niet gevonden')
        } else {
          setOrder(data)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-amber-500 animate-spin mb-4" />
          <p className="text-gray-600">Bestelling laden...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle size={64} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oeps!</h1>
          <p className="text-gray-600 mb-6">{error || 'Bestelling niet gevonden'}</p>
          <button
            onClick={() => navigate('/shop/products')}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition"
          >
            Terug naar shop
          </button>
        </div>
      </div>
    )
  }

  const isPaid = order.status === 'paid'
  const isCancelled = order.status === 'cancelled'
  const isPending = order.status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Status Icon */}
        {isPaid && (
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
        )}
        {isCancelled && (
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-600" />
          </div>
        )}
        {isPending && (
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 size={40} className="text-amber-600 animate-spin" />
          </div>
        )}

        {/* Status Message */}
        {isPaid && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedankt voor je bestelling!</h1>
            <p className="text-gray-600 mb-6">
              Je betaling is ontvangen. We gaan direct aan de slag met je bestelling.
            </p>
          </>
        )}
        {isCancelled && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling geannuleerd</h1>
            <p className="text-gray-600 mb-6">
              Je betaling is niet voltooid. Je kunt het opnieuw proberen.
            </p>
          </>
        )}
        {isPending && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling verwerken...</h1>
            <p className="text-gray-600 mb-6">
              We wachten nog op bevestiging van je betaling. Dit kan enkele minuten duren.
            </p>
          </>
        )}

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-gray-500" />
            <span className="font-medium text-gray-900">Bestelling #{order.order_number}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Naam</span>
              <span className="text-gray-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="text-gray-900">{order.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Levering</span>
              <span className="text-gray-900 flex items-center gap-1">
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
            <div className="flex justify-between font-medium pt-2 border-t">
              <span className="text-gray-900">Totaal</span>
              <span className="text-gray-900">€{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        {isPaid && order.delivery_method === 'pickup' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-amber-800">
              <strong>Ophalen bij:</strong><br />
              Reconnect Academy<br />
              Erembodegemstraat 31, 9300 Aalst<br /><br />
              We sturen je een email wanneer je bestelling klaar ligt.
            </p>
          </div>
        )}

        {isPaid && order.delivery_method === 'shipping' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>Verzending:</strong><br />
              Je ontvangt een email met tracking informatie zodra je pakket onderweg is.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/shop/products')}
            className="w-full px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition"
          >
            Verder winkelen
          </button>

          {isCancelled && (
            <button
              onClick={() => navigate('/shop/checkout')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Opnieuw proberen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopOrderComplete
