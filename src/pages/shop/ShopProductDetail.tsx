import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Package, Clock, Check, Truck, Store, AlertCircle } from 'lucide-react'
import { useProduct, useShopCart } from '../../hooks/shop'
import { getEffectivePrice, getPreorderPrice, hasStock, canPreorder, DEFAULT_SHIPPING_CONFIG } from '../../types/shop'
import type { ProductVariant } from '../../types/shop'
import { ShopCart } from '../../components/shop/public/ShopCart'

type PurchaseMode = 'stock' | 'preorder'

export function ShopProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProduct(slug)
  const { addItem, itemCount, getItemQuantity } = useShopCart()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('stock')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  // Set default variant when product loads
  if (product && !selectedVariant && product.variants.length > 0) {
    setSelectedVariant(product.variants[0])
  }

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return

    addItem(product, selectedVariant.id, purchaseMode === 'preorder')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-10 bg-gray-200 rounded w-1/3 mt-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product niet gevonden</h1>
          <p className="text-gray-600 mb-6">Dit product bestaat niet of is niet meer beschikbaar.</p>
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

  const price = getEffectivePrice(product)
  const preorderPrice = getPreorderPrice(product)
  const inStock = hasStock(product, product.variants)
  const allowPreorder = canPreorder(product)
  const variantPrice = selectedVariant
    ? (purchaseMode === 'preorder' ? preorderPrice : price) + (selectedVariant.price_adjustment || 0)
    : purchaseMode === 'preorder' ? preorderPrice : price

  // Determine available purchase modes
  const canBuyStock = inStock && selectedVariant && selectedVariant.stock_quantity > 0
  const canBuyPreorder = allowPreorder

  // Auto-select purchase mode based on availability
  if (purchaseMode === 'stock' && !canBuyStock && canBuyPreorder) {
    setPurchaseMode('preorder')
  } else if (purchaseMode === 'preorder' && !canBuyPreorder && canBuyStock) {
    setPurchaseMode('stock')
  }

  const currentQuantityInCart = selectedVariant ? getItemQuantity(selectedVariant.id) : 0
  const canAdd = purchaseMode === 'preorder' || (selectedVariant && currentQuantityInCart < selectedVariant.stock_quantity)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span>Terug</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ShoppingBag size={24} className="text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              {product.featured_image || product.images[0] ? (
                <img
                  src={product.featured_image || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package size={64} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
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

          {/* Product info */}
          <div>
            {/* Badges */}
            <div className="flex gap-2 mb-3">
              {product.featured && (
                <span className="px-2 py-1 bg-amber-400 text-gray-900 text-xs font-bold rounded">
                  Featured
                </span>
              )}
              {allowPreorder && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1">
                  <Clock size={12} />
                  Pre-order beschikbaar
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Variant selector */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kies je maat/variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const outOfStock = variant.stock_quantity === 0 && !allowPreorder
                    return (
                      <button
                        key={variant.id}
                        onClick={() => !outOfStock && setSelectedVariant(variant)}
                        disabled={outOfStock}
                        className={`px-4 py-2 rounded-lg border-2 transition ${
                          selectedVariant?.id === variant.id
                            ? 'border-amber-400 bg-amber-50'
                            : outOfStock
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-medium">{variant.name}</span>
                        {variant.stock_quantity > 0 && variant.stock_quantity <= 5 && (
                          <span className="ml-2 text-xs text-orange-600">
                            Nog {variant.stock_quantity}
                          </span>
                        )}
                        {variant.stock_quantity === 0 && !allowPreorder && (
                          <span className="ml-2 text-xs text-red-500">Uitverkocht</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Purchase mode selector (stock vs preorder) */}
            {canBuyStock && canBuyPreorder && (
              <div className="mb-6 bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kies je besteloptie
                </label>
                <div className="space-y-2">
                  {/* Stock option */}
                  <button
                    onClick={() => setPurchaseMode('stock')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      purchaseMode === 'stock'
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          purchaseMode === 'stock' ? 'border-amber-400 bg-amber-400' : 'border-gray-300'
                        }`}>
                          {purchaseMode === 'stock' && <Check size={14} className="text-white" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Direct uit voorraad</div>
                          <div className="text-sm text-gray-500">
                            {selectedVariant?.stock_quantity || 0} beschikbaar
                          </div>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        €{(price + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
                      </span>
                    </div>
                  </button>

                  {/* Preorder option */}
                  <button
                    onClick={() => setPurchaseMode('preorder')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      purchaseMode === 'preorder'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          purchaseMode === 'preorder' ? 'border-blue-400 bg-blue-400' : 'border-gray-300'
                        }`}>
                          {purchaseMode === 'preorder' && <Check size={14} className="text-white" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Pre-order</div>
                          <div className="text-sm text-blue-600">
                            {product.preorder_discount_percent
                              ? `${product.preorder_discount_percent}% korting`
                              : 'Vooraf bestellen'}
                          </div>
                          {product.preorder_note && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.preorder_note}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">
                          €{(preorderPrice + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
                        </span>
                        {product.preorder_discount_percent && (
                          <div className="text-xs text-gray-400 line-through">
                            €{(price + (selectedVariant?.price_adjustment || 0)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Only preorder available message */}
            {!canBuyStock && canBuyPreorder && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Alleen pre-order beschikbaar</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Dit product is momenteel niet op voorraad maar kan vooraf besteld worden.
                    </p>
                    {product.preorder_note && (
                      <p className="text-sm text-blue-600 mt-1">{product.preorder_note}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Out of stock message */}
            {!canBuyStock && !canBuyPreorder && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="font-medium text-red-800">Dit product is uitverkocht</p>
                </div>
              </div>
            )}

            {/* Price display */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                €{variantPrice.toFixed(2)}
              </div>
              {purchaseMode === 'preorder' && product.preorder_discount_percent && (
                <div className="text-sm text-gray-500">
                  <span className="line-through">€{(price + (selectedVariant?.price_adjustment || 0)).toFixed(2)}</span>
                  <span className="ml-2 text-green-600 font-medium">
                    Je bespaart €{((price - preorderPrice)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Add to cart button */}
            {(canBuyStock || canBuyPreorder) && selectedVariant && (
              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : purchaseMode === 'preorder'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-gray-900'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {addedToCart ? (
                  <>
                    <Check size={24} />
                    Toegevoegd!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={24} />
                    {purchaseMode === 'preorder' ? 'Pre-order toevoegen' : 'In winkelwagen'}
                  </>
                )}
              </button>
            )}

            {/* Shipping info */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Store size={18} className="text-gray-400" />
                <span>Gratis ophalen bij {DEFAULT_SHIPPING_CONFIG.pickup_location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck size={18} className="text-gray-400" />
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
      </main>

      {/* Cart sidebar */}
      <ShopCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ShopProductDetail
