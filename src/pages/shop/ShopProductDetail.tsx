import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Clock, Check, Truck, Store } from 'lucide-react'
import { useProduct, useShopCart } from '../../hooks/shop'
import { VariantSelector } from '../../components/shop/public/VariantSelector'
import { ShopCart } from '../../components/shop/public/ShopCart'
import { getEffectivePrice, isInPresale, getPreorderPrice, canPreorder, DEFAULT_SHIPPING_CONFIG } from '../../types/shop'

type PurchaseMode = 'stock' | 'preorder'

export const ShopProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()

  const { data: product, isLoading } = useProduct(slug)
  const { addItem, itemCount } = useShopCart()

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('stock')
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Compute derived values using useMemo to avoid recalculation issues
  const { selectedVariant, effectivePrice, preorderPrice, showPresale, allowPreorder, canBuyStock, canBuyPreorder } = useMemo(() => {
    if (!product) {
      return {
        selectedVariant: null,
        effectivePrice: 0,
        preorderPrice: 0,
        showPresale: false,
        allowPreorder: false,
        canBuyStock: false,
        canBuyPreorder: false,
      }
    }

    const variant = product.variants.find(v => v.id === selectedVariantId) || null
    const effective = getEffectivePrice(product)
    const preorder = getPreorderPrice(product)
    const presale = isInPresale(product)
    const preorderAllowed = canPreorder(product)
    const inStock = variant && variant.stock_quantity > 0

    return {
      selectedVariant: variant,
      effectivePrice: effective,
      preorderPrice: preorder,
      showPresale: presale,
      allowPreorder: preorderAllowed,
      canBuyStock: !!inStock,
      canBuyPreorder: presale || preorderAllowed,
    }
  }, [product, selectedVariantId])

  // Auto-select first available variant when product loads
  useEffect(() => {
    if (product && !selectedVariantId) {
      const presale = isInPresale(product)
      const preorderAllowed = canPreorder(product)
      const firstAvailableVariant = (presale || preorderAllowed)
        ? product.variants[0]
        : product.variants.find(v => v.stock_quantity > 0)
      if (firstAvailableVariant) {
        setSelectedVariantId(firstAvailableVariant.id)
      }
    }
  }, [product]) // Only depend on product, not selectedVariantId

  // Auto-select purchase mode based on what's available
  // This only runs once when the product loads, not on every change
  useEffect(() => {
    if (!product) return

    const presale = isInPresale(product)
    const preorderAllowed = canPreorder(product)
    const hasPreorder = presale || preorderAllowed

    // If no stock available but preorder is, default to preorder
    const anyInStock = product.variants.some(v => v.stock_quantity > 0)
    if (!anyInStock && hasPreorder) {
      setPurchaseMode('preorder')
    }
  }, [product]) // Only run when product changes

  const finalPrice = selectedVariant
    ? (purchaseMode === 'preorder' ? preorderPrice : effectivePrice) + selectedVariant.price_adjustment
    : purchaseMode === 'preorder' ? preorderPrice : effectivePrice

  const handleAddToCart = () => {
    if (!selectedVariant || !product) return

    addItem(product, selectedVariant.id, purchaseMode === 'preorder', quantity)
    setQuantity(1) // Reset quantity after adding
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4" />
          <p className="text-neutral-400">Laden...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Product niet gevonden</h2>
          <Link to="/products" className="text-amber-400 hover:underline">
            Terug naar shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-amber-400 hover:bg-amber-500 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
      >
        <ShoppingBag size={24} className="text-gray-900" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-neutral-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Breadcrumb */}
      <div className="bg-neutral-950 border-b border-neutral-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Link to="/products" className="hover:text-amber-400 flex items-center gap-1">
              <ArrowLeft size={16} />
              Shop
            </Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 bg-neutral-950 rounded-2xl shadow-sm p-6">
          {/* Image */}
          <div>
            <div className="aspect-square bg-neutral-800 rounded-xl overflow-hidden">
              {product.featured_image || product.images[0] ? (
                <img
                  src={product.featured_image || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  Geen afbeelding
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-400 transition"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Badges */}
            <div className="flex gap-2 mb-3">
              {(showPresale || allowPreorder) && (
                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 text-sm font-bold rounded-full">
                  <Clock size={14} />
                  PRE-ORDER
                </span>
              )}
              {product.featured && (
                <span className="bg-amber-400 text-black px-3 py-1 text-sm font-bold rounded-full">
                  FEATURED
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>

            {/* Price */}
            <div className="mb-4">
              <span className="text-2xl font-bold text-amber-400">
                €{finalPrice.toFixed(2)}
              </span>
              {purchaseMode === 'preorder' && product.base_price > preorderPrice && (
                <span className="ml-3 text-lg text-neutral-500 line-through">
                  €{(selectedVariant ? product.base_price + selectedVariant.price_adjustment : product.base_price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Purchase Mode Selector */}
            {canBuyStock && canBuyPreorder && (
              <div className="mb-6 bg-neutral-800 rounded-xl p-4">
                <label className="block text-sm font-medium text-white mb-3">Besteloptie</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPurchaseMode('stock')}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      purchaseMode === 'stock'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {purchaseMode === 'stock' && <Check size={16} className="text-amber-400" />}
                      <span className="font-medium text-white">Direct uit voorraad</span>
                    </div>
                    <p className="text-sm text-neutral-400">{selectedVariant?.stock_quantity || 0} beschikbaar</p>
                    <p className="text-lg font-bold text-white mt-1">
                      €{(effectivePrice + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
                    </p>
                  </button>

                  <button
                    onClick={() => setPurchaseMode('preorder')}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      purchaseMode === 'preorder'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {purchaseMode === 'preorder' && <Check size={16} className="text-emerald-400" />}
                      <span className="font-medium text-white">Pre-order</span>
                    </div>
                    <p className="text-sm text-emerald-400">
                      {product.preorder_discount_percent ? `${product.preorder_discount_percent}% korting` : 'Vooraf bestellen'}
                    </p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      €{(preorderPrice + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
                    </p>
                  </button>
                </div>
                {product.preorder_note && purchaseMode === 'preorder' && (
                  <p className="text-xs text-neutral-400 mt-2">{product.preorder_note}</p>
                )}
              </div>
            )}

            {/* Only preorder available */}
            {!canBuyStock && canBuyPreorder && (
              <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-emerald-400 text-sm">
                  <strong>Pre-order beschikbaar!</strong> Dit product is momenteel niet op voorraad maar kan vooraf besteld worden.
                </p>
                {product.preorder_note && (
                  <p className="text-neutral-400 text-xs mt-1">{product.preorder_note}</p>
                )}
              </div>
            )}

            <div className="prose prose-sm mb-6">
              <p className="text-neutral-300">{product.description}</p>
            </div>

            {/* Variant Selection */}
            <div className="mb-6">
              <VariantSelector
                variants={product.variants}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
                isPresale={showPresale || allowPreorder}
              />
            </div>

            {/* Quantity */}
            {selectedVariant && (canBuyStock || canBuyPreorder) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Aantal</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-neutral-600 rounded-lg text-white hover:bg-neutral-800"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={purchaseMode === 'preorder' ? 99 : selectedVariant.stock_quantity}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      const maxQty = purchaseMode === 'preorder' ? 99 : selectedVariant.stock_quantity
                      setQuantity(Math.max(1, Math.min(maxQty, value)))
                    }}
                    className="w-20 h-10 text-center border border-neutral-600 rounded-lg bg-neutral-800 text-white"
                  />
                  <button
                    onClick={() => {
                      const maxQty = purchaseMode === 'preorder' ? 99 : selectedVariant.stock_quantity
                      setQuantity(Math.min(maxQty, quantity + 1))
                    }}
                    className="w-10 h-10 border border-neutral-600 rounded-lg text-white hover:bg-neutral-800"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || (!canBuyStock && !canBuyPreorder)}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                ${selectedVariant && (canBuyStock || canBuyPreorder)
                  ? purchaseMode === 'preorder'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-gray-900'
                  : 'bg-neutral-700 cursor-not-allowed text-neutral-500'
                }
              `}
            >
              {showSuccess ? (
                <>
                  <Check size={24} />
                  Toegevoegd!
                </>
              ) : !selectedVariant ? (
                'Selecteer een variant'
              ) : !canBuyStock && !canBuyPreorder ? (
                'Uitverkocht'
              ) : purchaseMode === 'preorder' ? (
                <>
                  <ShoppingBag size={24} />
                  Pre-order plaatsen
                </>
              ) : (
                <>
                  <ShoppingBag size={24} />
                  Toevoegen aan winkelwagen
                </>
              )}
            </button>

            {/* Shipping info */}
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3">
              <div className="flex items-center gap-3 text-sm text-neutral-400">
                <Store size={18} className="text-neutral-500" />
                <span>Gratis ophalen bij {DEFAULT_SHIPPING_CONFIG.pickup_location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-400">
                <Truck size={18} className="text-neutral-500" />
                <span>
                  Verzending €{DEFAULT_SHIPPING_CONFIG.shipping_cost.toFixed(2)}
                  {DEFAULT_SHIPPING_CONFIG.free_shipping_threshold > 0 && (
                    <> (gratis vanaf €{DEFAULT_SHIPPING_CONFIG.free_shipping_threshold})</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <ShopCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ShopProductDetail
