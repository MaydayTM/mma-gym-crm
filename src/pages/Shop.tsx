import { useState } from 'react'
import {
  ShoppingBag,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Settings,
} from 'lucide-react'
import { useModules } from '../hooks/useModules'
import { useProducts } from '../hooks/shop/useProducts'
import { useOrders } from '../hooks/shop/useOrders'
import { ProductsManager } from '../components/shop/admin/ProductsManager'
import { OrdersManager } from '../components/shop/admin/OrdersManager'
import { ShopDocumentation } from '../components/shop/admin/ShopDocumentation'
import { BannersManager } from '../components/shop/admin/BannersManager'
import { isShopConfigured } from '../lib/shopSupabase'

// Shop frontend URL for public shop
// The new shop frontend runs on /shop/products in this same app
const SHOP_FRONTEND_URL = '/shop/products'

export function Shop() {
  const { hasAccess, getTrialInfo } = useModules()
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'banners' | 'settings' | 'guidelines'>('overview')
  const trialInfo = getTrialInfo('shop')

  // Fetch real data for stats
  const { data: products } = useProducts({ includeInactive: true })
  const { data: orders } = useOrders({})

  // Calculate stats
  const totalProducts = products?.length || 0
  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const lowStockCount = products?.reduce((count, product) => {
    const lowStockVariants = product.variants?.filter(v =>
      v.stock_quantity <= (v.low_stock_alert || 5)
    ).length || 0
    return count + lowStockVariants
  }, 0) || 0

  // Check access
  if (!hasAccess('shop')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Shop Module</h2>
          <p className="text-neutral-400 mb-6">
            Verkoop merchandise en producten rechtstreeks aan je leden. Start een gratis proefperiode om deze module te activeren.
          </p>
          <button className="px-6 py-3 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors">
            Start 30-dagen trial
          </button>
        </div>
      </div>
    )
  }

  // Check if shop is configured
  if (!isShopConfigured()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Shop niet geconfigureerd</h2>
          <p className="text-neutral-400 mb-6">
            De shop environment variables zijn niet ingesteld. Voeg de volgende variabelen toe aan je .env bestand:
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-sm font-mono text-neutral-300">
            <p>VITE_SHOP_SUPABASE_URL=...</p>
            <p>VITE_SHOP_SUPABASE_ANON_KEY=...</p>
            <p>VITE_SHOP_TENANT_ID=...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shop</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Beheer je producten, bestellingen en voorraad
          </p>
        </div>
        <div className="flex items-center gap-3">
          {trialInfo.isTrialing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{trialInfo.daysLeft} dagen trial over</span>
            </div>
          )}
          <a
            href={SHOP_FRONTEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Bekijk shop</span>
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Producten"
          value={totalProducts.toString()}
          trend={`${products?.filter(p => p.is_active).length || 0} actief`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Bestellingen"
          value={totalOrders.toString()}
          trend={`${orders?.filter(o => o.status === 'pending').length || 0} in afwachting`}
        />
        <StatCard
          icon={TrendingUp}
          label="Omzet"
          value={`€${totalRevenue.toFixed(2)}`}
          trend="Totaal"
        />
        <StatCard
          icon={AlertCircle}
          label="Lage voorraad"
          value={lowStockCount.toString()}
          trend={lowStockCount > 0 ? "Actie vereist" : "Alles op voorraad"}
          alert={lowStockCount > 0}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overzicht' },
            { id: 'products', label: 'Producten' },
            { id: 'orders', label: 'Bestellingen' },
            { id: 'banners', label: 'Banners' },
            { id: 'guidelines', label: 'Richtlijnen' },
            { id: 'settings', label: 'Instellingen' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                ? 'text-amber-400'
                : 'text-neutral-400 hover:text-white'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && <ShopOverview products={products} orders={orders} />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'banners' && <BannersManager />}
        {activeTab === 'guidelines' && <ShopDocumentation />}
        {activeTab === 'settings' && <ShopSettings />}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: string
  trend: string
  alert?: boolean
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert ? 'bg-red-500/10' : 'bg-amber-400/10'
            }`}
        >
          <Icon className={`w-5 h-5 ${alert ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <span className="text-sm text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className={`text-xs mt-1 ${alert ? 'text-red-400' : 'text-neutral-500'}`}>{trend}</p>
    </div>
  )
}

interface ShopOverviewProps {
  products?: Array<{ id: string; name: string; is_active: boolean; variants?: Array<{ stock_quantity: number }> }>
  orders?: Array<{ id: string; order_number: string; customer_name: string; total_amount: number; status: string; created_at: string }>
}

function ShopOverview({ products, orders }: ShopOverviewProps) {
  const recentOrders = orders?.slice(0, 5) || []
  const activeProducts = products?.filter(p => p.is_active).length || 0
  const inactiveProducts = products?.filter(p => !p.is_active).length || 0

  return (
    <div className="space-y-6">
      {/* Recent Orders */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recente bestellingen</h3>

        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-white">{order.order_number}</p>
                  <p className="text-sm text-neutral-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">€{order.total_amount.toFixed(2)}</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                    }`}>
                    {order.status === 'paid' ? 'Betaald' :
                      order.status === 'shipped' ? 'Verzonden' :
                        order.status === 'cancelled' ? 'Geannuleerd' :
                          'In afwachting'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen bestellingen</p>
          </div>
        )}
      </div>

      {/* Product Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Product overzicht</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Actieve producten</span>
              <span className="font-medium text-green-400">{activeProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Inactieve producten</span>
              <span className="font-medium text-neutral-400">{inactiveProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Totaal producten</span>
              <span className="font-medium text-white">{products?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bestel statistieken</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">In afwachting</span>
              <span className="font-medium text-amber-400">{orders?.filter(o => o.status === 'pending').length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Betaald</span>
              <span className="font-medium text-green-400">{orders?.filter(o => o.status === 'paid').length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Verzonden</span>
              <span className="font-medium text-blue-400">{orders?.filter(o => o.status === 'shipped').length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShopSettings() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Shop instellingen</h3>

      <div className="grid gap-4">
        <SettingCard
          title="Stripe koppeling"
          description="Koppel je Stripe account voor betalingen"
          action="Configureren"
        />
        <SettingCard
          title="Verzendkosten"
          description="Stel verzendkosten en -zones in"
          action="Beheren"
        />
        <SettingCard
          title="Email templates"
          description="Pas orderbevestigingen en notificaties aan"
          action="Aanpassen"
        />
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <p className="text-sm text-amber-400">
          Geavanceerde instellingen zijn momenteel in ontwikkeling. Neem contact op voor hulp bij de configuratie.
        </p>
      </div>
    </div>
  )
}

function SettingCard({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: string
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
      <div>
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
      >
        <Settings className="w-4 h-4" />
        <span>{action}</span>
      </button>
    </div>
  )
}
