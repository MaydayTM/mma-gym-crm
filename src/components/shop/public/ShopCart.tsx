import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, Store, Clock } from 'lucide-react'
import type { Cart, CartItem, DeliveryMethod, ShippingConfig } from '../../../types/shop'
import { DEFAULT_SHIPPING_CONFIG, calculateShipping } from '../../../types/shop'
import { useShopCart } from '../../../hooks/shop'

// Standalone version that uses the hook internally
interface ShopCartStandaloneProps {
  isOpen: boolean
  onClose: () => void
  shippingConfig?: ShippingConfig
}

export const ShopCart: React.FC<ShopCartStandaloneProps> = ({
  isOpen,
  onClose,
  shippingConfig = DEFAULT_SHIPPING_CONFIG,
}) => {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeItem, setDeliveryMethod } = useShopCart()

  const handleCheckout = () => {
    onClose()
    navigate('/shop/checkout')
  }

  if (!isOpen) return null

  return (
    <ShopCartContent
      cart={cart}
      shippingConfig={shippingConfig}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
      onDeliveryMethodChange={setDeliveryMethod}
      onCheckout={handleCheckout}
      onClose={onClose}
    />
  )
}

// Controlled version for custom implementations
interface ShopCartControlledProps {
  cart: Cart
  shippingConfig?: ShippingConfig
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemoveItem: (variantId: string) => void
  onDeliveryMethodChange: (method: DeliveryMethod) => void
  onCheckout: () => void
  onClose: () => void
}

export const ShopCartControlled: React.FC<ShopCartControlledProps> = (props) => {
  return <ShopCartContent {...props} />
}

// Internal content component
const ShopCartContent: React.FC<ShopCartControlledProps> = ({
  cart,
  shippingConfig = DEFAULT_SHIPPING_CONFIG,
  onUpdateQuantity,
  onRemoveItem,
  onDeliveryMethodChange,
  onCheckout,
  onClose
}) => {
  const hasPreorderItems = cart.items.some(item => item.is_preorder)
  const shippingCost = calculateShipping(cart.subtotal, cart.delivery_method, shippingConfig)
  const qualifiesForFreeShipping = shippingConfig.free_shipping_threshold > 0 &&
    cart.subtotal >= shippingConfig.free_shipping_threshold
  const amountUntilFreeShipping = shippingConfig.free_shipping_threshold > 0
    ? Math.max(0, shippingConfig.free_shipping_threshold - cart.subtotal)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Cart Panel */}
      <div className="relative bg-white w-full max-w-md h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={24} />
            Winkelwagen
            <span className="text-sm font-normal text-gray-500">
              ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Je winkelwagen is leeg</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <CartItemCard
                key={item.variant_id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </div>

        {/* Delivery Options */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Levering</h3>

            {/* Free shipping progress */}
            {shippingConfig.shipping_enabled && amountUntilFreeShipping > 0 && cart.delivery_method === 'shipping' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  Nog <strong>€{amountUntilFreeShipping.toFixed(2)}</strong> voor gratis verzending!
                </p>
                <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, (cart.subtotal / shippingConfig.free_shipping_threshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Pickup Option */}
              {shippingConfig.pickup_enabled && (
                <button
                  type="button"
                  onClick={() => onDeliveryMethodChange('pickup')}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    cart.delivery_method === 'pickup'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Store size={20} className={cart.delivery_method === 'pickup' ? 'text-amber-600' : 'text-gray-400'} />
                  <p className="font-medium text-gray-900 mt-1">Ophalen</p>
                  <p className="text-sm text-green-600 font-medium">Gratis</p>
                  <p className="text-xs text-gray-500 mt-1">{shippingConfig.pickup_location}</p>
                </button>
              )}

              {/* Shipping Option */}
              {shippingConfig.shipping_enabled && (
                <button
                  type="button"
                  onClick={() => onDeliveryMethodChange('shipping')}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    cart.delivery_method === 'shipping'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Truck size={20} className={cart.delivery_method === 'shipping' ? 'text-amber-600' : 'text-gray-400'} />
                  <p className="font-medium text-gray-900 mt-1">Verzenden</p>
                  {qualifiesForFreeShipping ? (
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

            {/* Preorder Notice */}
            {hasPreorderItems && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Clock size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Pre-order items in je winkelwagen</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Deze items worden later geleverd. Zie details per product.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary & Checkout */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotaal</span>
                <span>€{cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Korting</span>
                  <span>-€{cart.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Verzendkosten</span>
                <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Totaal</span>
                <span>€{(cart.subtotal - cart.discount_amount + shippingCost).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition"
            >
              Afrekenen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Cart Item Card Component
const CartItemCard: React.FC<{
  item: CartItem
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemove: (variantId: string) => void
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const hasDiscount = item.original_price > item.price

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Image */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.product_name}
          className="w-20 h-20 object-cover rounded-lg"
        />
      ) : (
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
          <ShoppingBag size={24} className="text-gray-400" />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.product_name}</h4>
        <p className="text-sm text-gray-500">{item.variant_name}</p>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium text-gray-900">€{item.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">€{item.original_price.toFixed(2)}</span>
          )}
        </div>

        {/* Preorder badge */}
        {item.is_preorder && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              <Clock size={12} />
              Pre-order
            </span>
            {item.preorder_note && (
              <p className="text-xs text-gray-500 mt-0.5">{item.preorder_note}</p>
            )}
          </div>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
            >
              <Minus size={16} className="text-gray-700" />
            </button>
            <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
              disabled={!item.is_preorder && item.quantity >= item.stock_available}
              className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
            >
              <Plus size={16} className="text-gray-700" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.variant_id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShopCart
