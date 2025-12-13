import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { ShopCheckoutForm } from '../../components/shop/public/ShopCheckoutForm'
import { useShopCart } from '../../hooks/shop/useShopCart'
import type { DeliveryMethod } from '../../types/shop'
import { DEFAULT_SHIPPING_CONFIG } from '../../types/shop'

const SHOP_SUPABASE_URL = import.meta.env.VITE_SHOP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const SHOP_TENANT_ID = import.meta.env.VITE_SHOP_TENANT_ID

export function ShopCheckout() {
  const navigate = useNavigate()
  const { cart, itemCount, setDeliveryMethod, clearCart } = useShopCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: {
    customer_name: string
    customer_email: string
    customer_phone?: string
    shipping_street?: string
    shipping_city?: string
    shipping_postal_code?: string
    shipping_country: string
    notes?: string
    delivery_method: DeliveryMethod
  }) => {
    if (!SHOP_TENANT_ID) {
      setError('Shop is niet correct geconfigureerd')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Build shipping address if delivery method is shipping
      const shippingAddress = data.delivery_method === 'shipping' && data.shipping_street
        ? {
            street: data.shipping_street,
            city: data.shipping_city || '',
            postal_code: data.shipping_postal_code || '',
            country: data.shipping_country,
          }
        : undefined

      // Call edge function to create payment
      const response = await fetch(`${SHOP_SUPABASE_URL}/functions/v1/create-shop-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: SHOP_TENANT_ID,
          items: cart.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            variant_id: item.variant_id,
            variant_name: item.variant_name,
            price: item.price,
            original_price: item.original_price,
            quantity: item.quantity,
            is_preorder: item.is_preorder,
            preorder_note: item.preorder_note,
          })),
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          delivery_method: data.delivery_method,
          shipping_address: shippingAddress,
          notes: data.notes,
          redirect_url: `${window.location.origin}/shop/order-complete`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Er ging iets mis bij het aanmaken van de betaling')
      }

      // Clear cart before redirecting to Mollie
      clearCart()

      // Redirect to Mollie checkout
      window.location.href = result.checkout_url

    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
      setIsProcessing(false)
    }
  }

  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method)
  }

  // Empty cart
  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Je winkelwagen is leeg</h1>
          <p className="text-gray-600 mb-6">Voeg eerst producten toe aan je winkelwagen</p>
          <button
            onClick={() => navigate('/shop/products')}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition"
          >
            Naar de shop
          </button>
        </div>
      </div>
    )
  }

  // Processing payment
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-amber-500 animate-spin mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Betaling voorbereiden...</h1>
          <p className="text-gray-600">Je wordt doorgestuurd naar onze betaalprovider</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <ShopCheckoutForm
        cart={cart}
        shippingConfig={DEFAULT_SHIPPING_CONFIG}
        onSubmit={handleSubmit}
        onBack={() => navigate(-1)}
        onDeliveryMethodChange={handleDeliveryMethodChange}
      />
    </div>
  )
}

export default ShopCheckout
