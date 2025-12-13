import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Loader2, Store, Truck, CreditCard, ShoppingBag } from 'lucide-react'
import type { Cart, DeliveryMethod, ShippingConfig } from '../../../types/shop'
import { DEFAULT_SHIPPING_CONFIG, calculateShipping } from '../../../types/shop'

// Form data interface
interface CheckoutFormData {
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_street?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country: string
  notes?: string
}

interface ShopCheckoutFormProps {
  cart: Cart
  shippingConfig?: ShippingConfig
  onSubmit: (data: CheckoutFormData & { delivery_method: DeliveryMethod }) => Promise<void>
  onBack: () => void
  onDeliveryMethodChange: (method: DeliveryMethod) => void
}

export const ShopCheckoutForm: React.FC<ShopCheckoutFormProps> = ({
  cart,
  shippingConfig = DEFAULT_SHIPPING_CONFIG,
  onSubmit,
  onBack,
  onDeliveryMethodChange
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const shippingCost = calculateShipping(cart.subtotal, cart.delivery_method, shippingConfig)
  const total = cart.subtotal - cart.discount_amount + shippingCost

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      customer_name: '',
      customer_email: '',
      shipping_country: 'België'
    }
  })

  const handleFormSubmit = async (data: CheckoutFormData) => {
    // Validate shipping address if shipping method selected
    if (cart.delivery_method === 'shipping') {
      if (!data.shipping_street || !data.shipping_city || !data.shipping_postal_code) {
        setSubmitError('Vul een volledig verzendadres in')
        return
      }
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit({
        ...data,
        delivery_method: cart.delivery_method
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Er is een fout opgetreden')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Afrekenen</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingBag size={20} />
              Bestelling ({cart.items.length} items)
            </h2>
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.variant_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.product_name} - {item.variant_name}
                    {item.is_preorder && (
                      <span className="ml-1 text-blue-600">(Pre-order)</span>
                    )}
                  </span>
                  <span className="text-gray-900">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Levering</h2>
            <div className="grid grid-cols-2 gap-3">
              {shippingConfig.pickup_enabled && (
                <button
                  type="button"
                  onClick={() => onDeliveryMethodChange('pickup')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    cart.delivery_method === 'pickup'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Store size={24} className={cart.delivery_method === 'pickup' ? 'text-amber-600' : 'text-gray-400'} />
                  <p className="font-medium text-gray-900 mt-2">Ophalen in club</p>
                  <p className="text-sm text-green-600 font-medium">Gratis</p>
                  <p className="text-xs text-gray-500 mt-1">{shippingConfig.pickup_location}</p>
                </button>
              )}

              {shippingConfig.shipping_enabled && (
                <button
                  type="button"
                  onClick={() => onDeliveryMethodChange('shipping')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    cart.delivery_method === 'shipping'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Truck size={24} className={cart.delivery_method === 'shipping' ? 'text-amber-600' : 'text-gray-400'} />
                  <p className="font-medium text-gray-900 mt-2">Thuislevering</p>
                  {shippingCost === 0 ? (
                    <p className="text-sm text-green-600 font-medium">Gratis</p>
                  ) : (
                    <p className="text-sm text-gray-600">€{shippingConfig.shipping_cost.toFixed(2)}</p>
                  )}
                  {shippingConfig.free_shipping_threshold > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Gratis vanaf €{shippingConfig.free_shipping_threshold}
                    </p>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Contactgegevens</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam *
                </label>
                <input
                  {...register('customer_name')}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  placeholder="Je volledige naam"
                />
                {errors.customer_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  {...register('customer_email')}
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  placeholder="je@email.com"
                />
                {errors.customer_email && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon (optioneel)
                </label>
                <input
                  {...register('customer_phone')}
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  placeholder="+32 ..."
                />
              </div>
            </div>
          </div>

          {/* Shipping Address (only for shipping) */}
          {cart.delivery_method === 'shipping' && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3">Verzendadres</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straat + huisnummer *
                  </label>
                  <input
                    {...register('shipping_street')}
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    placeholder="Straatnaam 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode *
                    </label>
                    <input
                      {...register('shipping_postal_code')}
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="9300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stad *
                    </label>
                    <input
                      {...register('shipping_city')}
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="Aalst"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <select
                    {...register('shipping_country')}
                    className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  >
                    <option value="België">België</option>
                    <option value="Nederland">Nederland</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Opmerkingen (optioneel)</h2>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="Speciale instructies voor je bestelling..."
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {submitError}
            </div>
          )}

          {/* Total & Submit */}
          <div className="bg-white rounded-lg p-4 shadow-sm sticky bottom-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotaal</span>
                <span>€{cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Korting</span>
                  <span>-€{cart.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Verzendkosten</span>
                <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Totaal</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verwerken...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Betalen (€{total.toFixed(2)})
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
              Je wordt doorgestuurd naar onze betaalprovider
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShopCheckoutForm
