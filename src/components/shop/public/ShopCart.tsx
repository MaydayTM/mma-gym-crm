import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Truck, Store, Clock } from 'lucide-react'
import { useShopCart } from '../../../hooks/shop'
import { CartItem } from './CartItem'
import { DEFAULT_SHIPPING_CONFIG, calculateShipping } from '../../../types/shop'
import type { ShippingConfig } from '../../../types/shop'

interface ShopCartProps {
  isOpen: boolean
  onClose: () => void
  shippingConfig?: ShippingConfig
}

// Check if we're on the shop subdomain
const isShopSubdomain = window.location.hostname.startsWith('shop.') ||
  window.location.hostname === 'shop.mmagym.be'

export const ShopCart: React.FC<ShopCartProps> = ({
  isOpen,
  onClose,
  shippingConfig = DEFAULT_SHIPPING_CONFIG,
}) => {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeItem, setDeliveryMethod } = useShopCart()

  // Handle ESC key to close cart
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleCheckout = () => {
    onClose()
    // Use different path based on subdomain
    navigate(isShopSubdomain ? '/checkout' : '/shop/checkout')
  }

  if (!isOpen) return null

  const hasPreorderItems = cart.items.some(item => item.is_preorder)
  const shippingCost = calculateShipping(cart.subtotal, cart.delivery_method, shippingConfig)
  const qualifiesForFreeShipping = shippingConfig.free_shipping_threshold > 0 &&
    cart.subtotal >= shippingConfig.free_shipping_threshold
  const amountUntilFreeShipping = shippingConfig.free_shipping_threshold > 0
    ? Math.max(0, shippingConfig.free_shipping_threshold - cart.subtotal)
    : 0

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-neutral-900 z-50 shadow-xl flex flex-col rounded-l-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Winkelwagen</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition"
            aria-label="Winkelwagen sluiten"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="mb-4">Je winkelwagen is leeg</p>
              <button
                onClick={onClose}
                className="text-amber-400 hover:underline"
              >
                Verder winkelen
              </button>
            </div>
          ) : (
            cart.items.map(item => (
              <CartItem
                key={`${item.variant_id}-${item.is_preorder}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Delivery Options */}
        {cart.items.length > 0 && (
          <div className="border-t border-neutral-700 p-4 space-y-3">
            <h3 className="font-medium text-white text-sm">Levering</h3>

            {/* Free shipping progress */}
            {shippingConfig.shipping_enabled && amountUntilFreeShipping > 0 && cart.delivery_method === 'shipping' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-400">
                  Nog <strong>€{amountUntilFreeShipping.toFixed(2)}</strong> voor gratis verzending!
                </p>
                <div className="mt-2 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${Math.min(100, (cart.subtotal / shippingConfig.free_shipping_threshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* Pickup Option */}
              {shippingConfig.pickup_enabled && (
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-3 rounded-lg border text-left transition ${
                    cart.delivery_method === 'pickup'
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Store size={18} className={cart.delivery_method === 'pickup' ? 'text-amber-400' : 'text-neutral-500'} />
                  <p className="font-medium text-white text-sm mt-1">Ophalen</p>
                  <p className="text-xs text-emerald-400 font-medium">Gratis</p>
                </button>
              )}

              {/* Shipping Option */}
              {shippingConfig.shipping_enabled && (
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('shipping')}
                  className={`p-3 rounded-lg border text-left transition ${
                    cart.delivery_method === 'shipping'
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <Truck size={18} className={cart.delivery_method === 'shipping' ? 'text-amber-400' : 'text-neutral-500'} />
                  <p className="font-medium text-white text-sm mt-1">Verzenden</p>
                  {qualifiesForFreeShipping ? (
                    <p className="text-xs text-emerald-400 font-medium">Gratis</p>
                  ) : (
                    <p className="text-xs text-neutral-400">€{shippingConfig.shipping_cost.toFixed(2)}</p>
                  )}
                </button>
              )}
            </div>

            {/* Preorder Notice */}
            {hasPreorderItems && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-2">
                <Clock size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-400">Pre-order items in je winkelwagen</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Deze items worden later geleverd.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-neutral-700 bg-neutral-800 rounded-bl-2xl">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-neutral-300">
                <span>Subtotaal</span>
                <span>€{cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Korting</span>
                  <span>-€{cart.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-neutral-300">
                <span>Verzending</span>
                <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-neutral-600 pt-2 text-white">
                <span>Totaal</span>
                <span>€{(cart.subtotal - cart.discount_amount + shippingCost).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="block w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-center rounded-lg transition-colors"
            >
              Afrekenen
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default ShopCart
