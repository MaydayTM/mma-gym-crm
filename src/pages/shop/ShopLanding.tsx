import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Truck, Shield, Headphones, ArrowRight, ShoppingBag } from 'lucide-react'
import {
  useProducts,
  useHeroBanner,
  usePromoBanner,
  useCategoryBanners,
  useSpotlightBanner,
} from '../../hooks/shop'
import { useShopCart } from '../../contexts/ShopCartContext'
import { ProductCard } from '../../components/shop/public/ProductCard'
import { ShopCart } from '../../components/shop/public/ShopCart'
import type { ProductCategory } from '../../types/shop'

// Default fallback content when no banners configured in database
const DEFAULT_HERO = {
  title: 'Train Like A Champion',
  subtitle: 'Official Reconnect MMA merchandise. Premium quality fight gear en kleding.',
  badge_text: 'NEW COLLECTION',
  cta_text: 'Shop Now',
  image_url: '/Fight GEAR.png',
}

const DEFAULT_PROMO = {
  title: 'GEAR UP FOR GREATNESS',
  subtitle: 'Pre-order nu en ontvang exclusieve early bird korting op onze nieuwste collectie',
  badge_text: 'PRE-ORDER',
  cta_text: 'Shop Pre-Orders',
}

const DEFAULT_CATEGORIES = [
  {
    id: 'clothing',
    name: 'Kleding',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
    description: 'Hoodies, T-shirts & meer'
  },
  {
    id: 'gear',
    name: 'Fight Gear',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=500&fit=crop',
    description: 'Handschoenen, Bescherming'
  },
  {
    id: 'accessories',
    name: 'Accessoires',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
    description: 'Tassen, Wraps & meer'
  },
]

const DEFAULT_SPOTLIGHT = {
  title: 'Custom Gloves',
  subtitle: '8 glove models, up to 20 customizable areas, nearly 30 materials available. Design je eigen unieke bokshandschoenen met het Reconnect logo.',
  badge_text: 'CUSTOM GEAR',
  cta_text: 'Customize Now',
  cta_link: '/shop/products/reconnect-boxing-gloves',
  image_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=600&fit=crop',
  features: [
    'Kies uit 8 verschillende modellen',
    'Personaliseer met je naam of gym logo',
    'Premium materialen & vakmanschap',
  ],
}

export const ShopLanding: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | ''>('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { itemCount } = useShopCart()

  const { data: products, isLoading } = useProducts({
    category: selectedCategory || undefined,
  })

  // Fetch all banners from database with fallbacks
  const { banner: heroBanner } = useHeroBanner()
  const { banner: promoBanner } = usePromoBanner()
  const { getCategory } = useCategoryBanners()
  const { banner: spotlightBanner } = useSpotlightBanner()

  // Use database banner or fallback to defaults
  const hero = {
    title: heroBanner?.title || DEFAULT_HERO.title,
    subtitle: heroBanner?.subtitle || DEFAULT_HERO.subtitle,
    badge_text: heroBanner?.badge_text || DEFAULT_HERO.badge_text,
    cta_text: heroBanner?.cta_text || DEFAULT_HERO.cta_text,
    image_url: heroBanner?.image_url || DEFAULT_HERO.image_url,
  }

  const promo = {
    title: promoBanner?.title || DEFAULT_PROMO.title,
    subtitle: promoBanner?.subtitle || DEFAULT_PROMO.subtitle,
    badge_text: promoBanner?.badge_text || DEFAULT_PROMO.badge_text,
    cta_text: promoBanner?.cta_text || DEFAULT_PROMO.cta_text,
  }

  const spotlight = {
    title: spotlightBanner?.title || DEFAULT_SPOTLIGHT.title,
    subtitle: spotlightBanner?.subtitle || DEFAULT_SPOTLIGHT.subtitle,
    badge_text: spotlightBanner?.badge_text || DEFAULT_SPOTLIGHT.badge_text,
    cta_text: spotlightBanner?.cta_text || DEFAULT_SPOTLIGHT.cta_text,
    cta_link: spotlightBanner?.cta_link || DEFAULT_SPOTLIGHT.cta_link,
    image_url: spotlightBanner?.image_url || DEFAULT_SPOTLIGHT.image_url,
  }

  // Build categories with database banners or fallbacks
  const categories = DEFAULT_CATEGORIES.map(cat => {
    const dbBanner = getCategory(cat.id)
    return {
      id: cat.id,
      name: dbBanner?.title || cat.name,
      description: dbBanner?.subtitle || cat.description,
      image: dbBanner?.image_url || cat.image,
    }
  })

  const featuredProducts = products?.filter(p => p.featured) || []
  const newProducts = products?.slice(0, 4) || []

  return (
    <div className="min-h-screen bg-neutral-950">
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

      {/* Hero Banner - configurable via CRM */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${hero.image_url}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            {hero.badge_text && (
              <span className="inline-block bg-amber-400 text-black text-sm font-bold px-3 py-1 rounded mb-4">
                {hero.badge_text}
              </span>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {hero.title.includes('Champion') ? (
                <>
                  {hero.title.split('Champion')[0]}<span className="text-amber-400">Champion</span>{hero.title.split('Champion')[1]}
                </>
              ) : (
                hero.title
              )}
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-8">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black px-6 py-3 rounded-full font-bold transition-colors"
              >
                {hero.cta_text}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 border border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded-full font-bold transition-colors"
              >
                Bekijk Featured
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="py-12 md:py-16 border-b border-neutral-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">New Products</h2>
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Banner - configurable via CRM */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            {promo.title}
          </h2>
          <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
            {promo.subtitle}
          </p>
          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-neutral-800 transition-colors"
          >
            {promo.cta_text}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Shop by Category - configurable via CRM */}
      <section className="py-12 md:py-16 border-b border-neutral-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Shop by Category</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id as ProductCategory)
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group relative h-80 rounded-2xl overflow-hidden text-left"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-neutral-300 text-sm">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section id="featured" className="py-12 md:py-16 border-b border-neutral-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Featured</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Spotlight Section - configurable via CRM */}
      <section className="py-16 md:py-24 bg-neutral-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Spotlight Image */}
            <div className="relative">
              <div className="aspect-[4/3] relative">
                {/* Gradient background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-red-500/20 rounded-3xl" />

                <img
                  src={spotlight.image_url}
                  alt={spotlight.title}
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />

                {/* Color options indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg" />
                  <div className="w-6 h-6 rounded-full bg-black border-2 border-white shadow-lg" />
                  <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow-lg" />
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-neutral-300 shadow-lg" />
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div>
              {spotlight.badge_text && (
                <span className="inline-block bg-amber-400/10 text-amber-400 text-sm font-bold px-3 py-1 rounded mb-4">
                  {spotlight.badge_text}
                </span>
              )}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {spotlight.title}
              </h2>
              <p className="text-neutral-400 text-lg mb-6">
                {spotlight.subtitle}
              </p>

              <ul className="space-y-3 mb-8">
                {DEFAULT_SPOTLIGHT.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-neutral-300">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to={spotlight.cta_link}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black px-6 py-3 rounded-full font-bold transition-colors"
              >
                {spotlight.cta_text}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section id="products" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Alle Producten</h2>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'bg-amber-400 text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Alles
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-neutral-800 rounded-xl animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products
                ?.filter(p => !selectedCategory || p.category === selectedCategory)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}

          {products?.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <p className="text-neutral-400 text-lg">Geen producten gevonden in deze categorie</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-neutral-900 border-t border-neutral-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Gratis verzending</h3>
                <p className="text-neutral-400 text-sm">Vanaf €200</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Veilig betalen</h3>
                <p className="text-neutral-400 text-sm">iDEAL, Bancontact, Visa</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-end">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Klantenservice</h3>
                <p className="text-neutral-400 text-sm">Altijd bereikbaar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping Cart Sidebar */}
      <ShopCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default ShopLanding
