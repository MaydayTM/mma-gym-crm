import React from 'react'
import type { ProductVariant } from '../../../types/shop'

type VariantSelectorProps = {
  variants: ProductVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
  isPresale?: boolean // Allow selection even with 0 stock for pre-orders
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelect,
  isPresale = false,
}) => {
  // Group variants by size
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))]

  const selectedVariant = variants.find(v => v.id === selectedVariantId)

  const getVariantByAttributes = (size: string | null, color: string | null) => {
    return variants.find(v =>
      (size === null || v.size === size) &&
      (color === null || v.color === color)
    )
  }

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-white">Maat</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => {
              const variant = getVariantByAttributes(size, selectedVariant?.color || null)
              const isSelected = selectedVariant?.size === size
              const isAvailable = variant && (isPresale || variant.stock_quantity > 0)

              return (
                <button
                  key={size}
                  onClick={() => variant && onSelect(variant.id)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 border rounded-lg font-medium transition-all
                    ${isSelected
                      ? 'bg-amber-400 border-amber-400 text-gray-900'
                      : 'bg-neutral-800 border-neutral-600 text-white hover:border-amber-400'
                    }
                    ${!isAvailable && 'opacity-50 cursor-not-allowed line-through'}
                  `}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-white">Kleur</label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => {
              const variant = getVariantByAttributes(selectedVariant?.size || null, color)
              const isSelected = selectedVariant?.color === color
              const isAvailable = variant && (isPresale || variant.stock_quantity > 0)

              return (
                <button
                  key={color}
                  onClick={() => variant && onSelect(variant.id)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 border rounded-lg font-medium transition-all
                    ${isSelected
                      ? 'bg-amber-400 border-amber-400 text-gray-900'
                      : 'bg-neutral-800 border-neutral-600 text-white hover:border-amber-400'
                    }
                    ${!isAvailable && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  {color}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock Indicator */}
      {selectedVariant && (
        <div className="text-sm">
          {isPresale ? (
            <span className="text-emerald-400 font-medium">Pre-order beschikbaar</span>
          ) : selectedVariant.stock_quantity > selectedVariant.low_stock_alert ? (
            <span className="text-emerald-400 font-medium">In voorraad</span>
          ) : selectedVariant.stock_quantity > 0 ? (
            <span className="text-orange-400 font-medium">
              Nog {selectedVariant.stock_quantity} stuks beschikbaar
            </span>
          ) : (
            <span className="text-red-400 font-medium">Uitverkocht</span>
          )}
        </div>
      )}
    </div>
  )
}

export default VariantSelector
