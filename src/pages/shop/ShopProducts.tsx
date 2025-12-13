import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingBag, Filter, Package, Clock } from 'lucide-react'
import { useProducts, useShopCart } from '../../hooks/shop'
import { getEffectivePrice, getPreorderPrice, hasStock, canPreorder } from '../../types/shop'
import type { ProductCategory, ProductWithVariants } from '../../types/shop'
import { ShopCart } from '../../components/shop/public/ShopCart'

const CATEGORIES: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'Alle producten' },
  { value: 'clothing', label: 'Kleding' },
  { value: 'gear', label: 'Uitrusting' },
  { value: 'accessories', label: 'Accessoires' },
]

function ProductCard({ product }: { product: ProductWithVariants }) {
  const price = getEffectivePrice(product)
  const preorderPrice = getPreorderPrice(product)
  const inStock = hasStock(product, product.variants)
  const allowPreorder = canPreorder(product)
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0)

  return (
    <Link
      to={`/shop/products/${product.seo_slug}`}
      className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.featured_image || product.images[0] ? (
          <img
            src={product.featured_image || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <span className="px-2 py-1 bg-amber-400 text-gray-900 text-xs font-bold rounded">
              Featured
            </span>
          )}
          {allowPreorder && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1">
              <Clock size={12} />
              Pre-order
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {!inStock && !allowPreorder && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">
              Uitverkocht
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            {/* Show both prices if preorder available with discount */}
            {allowPreorder && product.preorder_discount_percent ? (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">
                  €{price.toFixed(2)}
                </span>
                <span className="text-sm text-blue-600">
                  Pre-order: €{preorderPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                €{price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock info */}
          {inStock && (
            <span className="text-xs text-gray-500">
              {totalStock} op voorraad
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ShopProducts() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { itemCount } = useShopCart()

  const { data: products, isLoading } = useProducts({
    category: category || undefined,
    search: search || undefined,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/shop/products" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center">
                <span className="text-xl font-black text-gray-900">R</span>
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">Reconnect Shop</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cart button */}
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Category filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter size={18} className="text-gray-400 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                category === cat.value
                  ? 'bg-amber-400 text-gray-900 font-bold'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Geen producten gevonden</h2>
            <p className="text-gray-600">
              {search
                ? `Geen resultaten voor "${search}"`
                : 'Er zijn momenteel geen producten beschikbaar in deze categorie.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Cart sidebar */}
      <ShopCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ShopProducts
