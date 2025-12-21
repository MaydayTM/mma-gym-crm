import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Loader2, ArrowLeft, Clock } from 'lucide-react'
import { useShopCart } from '../../hooks/shop/useShopCart'
import { DEFAULT_SHIPPING_CONFIG, calculateShipping } from '../../types/shop'

const SHOP_SUPABASE_URL = import.meta.env.VITE_SHOP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const SHOP_TENANT_ID = import.meta.env.VITE_SHOP_TENANT_ID

// Check if we're on the shop subdomain
const isShopSubdomain = window.location.hostname.startsWith('shop.') ||
  window.location.hostname === 'shop.mmagym.be'

export function ShopCheckout() {
  const { cart, setDeliveryMethod, clearCart } = useShopCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_street: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'België',
    notes: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!SHOP_TENANT_ID) {
      setError('Shop is niet correct geconfigureerd')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Build shipping address if delivery method is shipping
      const shippingAddress = cart.delivery_method === 'shipping' && formData.shipping_street
        ? {
            street: formData.shipping_street,
            city: formData.shipping_city,
            postal_code: formData.shipping_postal_code,
            country: formData.shipping_country,
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
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone || undefined,
          delivery_method: cart.delivery_method,
          shipping_address: shippingAddress,
          notes: formData.notes || undefined,
          redirect_url: `${window.location.origin}${isShopSubdomain ? '/order-complete' : '/shop/order-complete'}`,
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

  const shippingCost = calculateShipping(cart.subtotal, cart.delivery_method, DEFAULT_SHIPPING_CONFIG)
  const total = cart.subtotal - cart.discount_amount + shippingCost
  const hasPreorderItems = cart.items.some(item => item.is_preorder)

  // Empty cart
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-neutral-600 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Je winkelwagen is leeg</h1>
          <p className="text-neutral-400 mb-6">Voeg eerst producten toe aan je winkelwagen</p>
          <Link
            to={isShopSubdomain ? '/products' : '/shop/products'}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition inline-block"
          >
            Naar de shop
          </Link>
        </div>
      </div>
    )
  }

  // Processing payment
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-amber-400 animate-spin mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Betaling voorbereiden...</h1>
          <p className="text-neutral-400">Je wordt doorgestuurd naar onze betaalprovider</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={isShopSubdomain ? '/products' : '/shop/products'}
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-400 mb-4"
          >
            <ArrowLeft size={20} />
            Terug naar shop
          </Link>
          <h1 className="text-3xl font-bold text-white">Afrekenen</h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-neutral-950 rounded-2xl shadow-sm p-6">
              {/* Contact Info */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Contactgegevens</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Naam *</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="Je volledige naam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">E-mail *</label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="je@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Telefoon</label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="+32 xxx xx xx xx"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Levering</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      cart.delivery_method === 'pickup'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <p className="font-bold text-white">Ophalen</p>
                    <p className="text-emerald-400 text-sm font-medium">Gratis</p>
                    <p className="text-xs text-neutral-400 mt-1">{DEFAULT_SHIPPING_CONFIG.pickup_location}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('shipping')}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      cart.delivery_method === 'shipping'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <p className="font-bold text-white">Verzenden</p>
                    <p className="text-sm text-neutral-400">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-400 font-medium">Gratis</span>
                      ) : (
                        `€${DEFAULT_SHIPPING_CONFIG.shipping_cost.toFixed(2)}`
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Gratis vanaf €{DEFAULT_SHIPPING_CONFIG.free_shipping_threshold}
                    </p>
                  </button>
                </div>
              </div>

              {/* Shipping Address */}
              {cart.delivery_method === 'shipping' && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-white mb-4">Verzendadres</h2>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Straat + huisnummer *</label>
                      <input
                        type="text"
                        name="shipping_street"
                        value={formData.shipping_street}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Straatnaam 123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Postcode *</label>
                        <input
                          type="text"
                          name="shipping_postal_code"
                          value={formData.shipping_postal_code}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          placeholder="9300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Stad *</label>
                        <input
                          type="text"
                          name="shipping_city"
                          value={formData.shipping_city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          placeholder="Aalst"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Land</label>
                      <select
                        name="shipping_country"
                        value={formData.shipping_country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      >
                        <option value="België">België</option>
                        <option value="Nederland">Nederland</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Opmerkingen</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Optionele opmerkingen voor je bestelling..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-lg rounded-xl transition"
              >
                Doorgaan naar betaling
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-neutral-950 rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="font-bold text-lg text-white mb-4">Bestelling</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 border-b border-neutral-700 pb-4">
                {cart.items.map(item => (
                  <div key={`${item.variant_id}-${item.is_preorder}`} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-white">{item.product_name}</p>
                      <p className="text-neutral-500 text-xs flex items-center gap-1">
                        {item.variant_name} × {item.quantity}
                        {item.is_preorder && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-400">
                            <Clock size={10} /> Pre-order
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="font-medium text-white">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Preorder Notice */}
              {hasPreorderItems && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-xs text-emerald-400">
                    <strong>Let op:</strong> Je bestelling bevat pre-order items die later geleverd worden.
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Subtotaal</span>
                  <span>€{cart.subtotal.toFixed(2)}</span>
                </div>
                {cart.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Korting</span>
                    <span>-€{cart.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Verzending</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-neutral-700 pt-2 text-white">
                  <span>Totaal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShopCheckout
