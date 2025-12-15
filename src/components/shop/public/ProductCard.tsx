import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { ProductWithVariants } from '../../../types/shop'
import { getEffectivePrice, isInPresale, getPreorderPrice, canPreorder } from '../../../types/shop'

type ProductCardProps = {
  product: ProductWithVariants
  basePath?: string // Allow custom base path for shop URL
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, basePath }) => {
  const location = useLocation()

  // Auto-detect basePath based on current URL
  // If on shop subdomain (path starts with / not /shop), use /products
  // If on main CRM domain (path starts with /shop), use /shop/products
  const detectedBasePath = basePath ?? (
    location.pathname.startsWith('/shop') ? '/shop/products' : '/products'
  )

  const productUrl = `${detectedBasePath}/${product.seo_slug}`
  console.log('[ProductCard] Product:', product.name, 'URL:', productUrl, 'slug:', product.seo_slug)
  const effectivePrice = getEffectivePrice(product)
  const showPresale = isInPresale(product)
  const allowPreorder = canPreorder(product)
  const preorderPrice = getPreorderPrice(product)

  // Calculate price range from variants using effective price
  const prices = product.variants.length > 0
    ? product.variants.map(v => effectivePrice + v.price_adjustment)
    : [effectivePrice]

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const priceDisplay = minPrice === maxPrice
    ? `€${minPrice.toFixed(2)}`
    : `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`

  // For presale/preorder, products are always "available" for ordering
  const inStock = product.availability_status !== 'out_of_stock' &&
    product.availability_status !== 'discontinued' &&
    (showPresale || allowPreorder || product.variants.length === 0 || product.variants.some(v => v.stock_quantity > 0))

  const imageUrl = product.featured_image || product.images[0]

  // Get available sizes for display
  const sizes = product.variants
    .filter(v => v.size && v.is_active && (v.stock_quantity > 0 || allowPreorder))
    .map(v => v.size)
    .filter((size, index, self) => self.indexOf(size) === index)

  return (
    <Link
      to={productUrl}
      className="group block bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="aspect-[3/4] bg-neutral-800 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <Plus className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {(showPresale || allowPreorder) && (
            <div className="bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide">
              Pre-order
            </div>
          )}
          {product.featured && (
            <div className="bg-amber-400 text-black px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide">
              Featured
            </div>
          )}
        </div>

        {/* Quick add button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-400 transition-colors">
            <Plus className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-wider">Uitverkocht</span>
          </div>
        )}

        {/* Size indicators */}
        {sizes.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex gap-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
            {sizes.slice(0, 5).map(size => (
              <span key={size} className="px-2 py-1 bg-black/80 text-white text-[10px] font-medium rounded">
                {size}
              </span>
            ))}
            {sizes.length > 5 && (
              <span className="px-2 py-1 bg-black/80 text-white text-[10px] font-medium rounded">
                +{sizes.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category tag */}
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
          {product.category === 'clothing' ? 'Kleding' : product.category === 'gear' ? 'Fight Gear' : 'Accessoires'}
        </span>

        {/* Product name */}
        <h3 className="font-bold text-white mt-1 mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{priceDisplay}</span>
          {(showPresale || allowPreorder) && product.base_price > effectivePrice && (
            <span className="text-sm text-neutral-500 line-through">
              €{product.base_price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Preorder price if different */}
        {allowPreorder && product.preorder_discount_percent && !showPresale && (
          <div className="text-xs text-emerald-400 mt-1">
            Pre-order: €{preorderPrice.toFixed(2)}
          </div>
        )}

        {/* Stock status */}
        {showPresale || allowPreorder ? (
          <span className="text-xs text-emerald-400 font-medium mt-1 block">Pre-order beschikbaar</span>
        ) : inStock ? (
          <span className="text-xs text-neutral-500 mt-1 block">Op voorraad</span>
        ) : null}
      </div>
    </Link>
  )
}

export default ProductCard
