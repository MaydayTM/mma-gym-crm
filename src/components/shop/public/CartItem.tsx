import React from 'react'
import { Clock } from 'lucide-react'
import type { CartItem as CartItemType } from '../../../types/shop'

type CartItemProps = {
  item: CartItemType
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemove: (variantId: string) => void
}

export const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const hasDiscount = item.original_price > item.price

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-700">
      {/* Image */}
      <div className="w-20 h-20 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
            Geen foto
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-white">{item.product_name}</h4>
        <p className="text-xs text-neutral-400 mb-1">{item.variant_name}</p>

        {/* Preorder badge */}
        {item.is_preorder && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium rounded-full">
              <Clock size={10} />
              Pre-order
            </span>
            {item.preorder_note && (
              <p className="text-[10px] text-neutral-500 mt-0.5">{item.preorder_note}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-6 h-6 border border-neutral-600 rounded text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            aria-label="Aantal verminderen"
          >
            -
          </button>
          <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
            disabled={!item.is_preorder && item.quantity >= item.stock_available}
            className="w-6 h-6 border border-neutral-600 rounded text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            aria-label="Aantal verhogen"
          >
            +
          </button>
        </div>
      </div>

      {/* Price & Remove */}
      <div className="text-right">
        <p className="font-bold text-sm text-white">€{(item.price * item.quantity).toFixed(2)}</p>
        {hasDiscount && (
          <p className="text-[10px] text-neutral-500 line-through">
            €{(item.original_price * item.quantity).toFixed(2)}
          </p>
        )}
        <button
          onClick={() => onRemove(item.variant_id)}
          className="text-xs text-red-400 hover:underline mt-1"
        >
          Verwijderen
        </button>
      </div>
    </div>
  )
}

export default CartItem
