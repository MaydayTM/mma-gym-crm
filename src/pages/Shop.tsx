import { useState } from 'react'
import {
  ShoppingBag,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Settings,
  Plus,
} from 'lucide-react'
import { useModules } from '../hooks/useModules'

// Shop module wordt gehost in reconnect-site, we embedden de admin hier
const SHOP_ADMIN_URL = import.meta.env.VITE_SHOP_ADMIN_URL || 'https://www.mmagym.be/admin/shop'
const SHOP_FRONTEND_URL = import.meta.env.VITE_SHOP_URL || 'https://www.mmagym.be/shop'

export function Shop() {
  const { hasAccess, getTrialInfo } = useModules()
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>('overview')
  const trialInfo = getTrialInfo('shop')

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
          value="12"
          trend="+2 deze maand"
        />
        <StatCard
          icon={ShoppingCart}
          label="Bestellingen"
          value="47"
          trend="+8 deze week"
        />
        <StatCard
          icon={TrendingUp}
          label="Omzet"
          value="€2,340"
          trend="+15% vs vorige maand"
        />
        <StatCard
          icon={AlertCircle}
          label="Lage voorraad"
          value="3"
          trend="Actie vereist"
          alert
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overzicht' },
            { id: 'products', label: 'Producten' },
            { id: 'orders', label: 'Bestellingen' },
            { id: 'settings', label: 'Instellingen' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {activeTab === 'overview' && <ShopOverview />}
        {activeTab === 'products' && <ShopProducts />}
        {activeTab === 'orders' && <ShopOrders />}
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
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            alert ? 'bg-red-500/10' : 'bg-amber-400/10'
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

function ShopOverview() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Recente activiteit</h3>

      {/* Placeholder - will be replaced with real data */}
      <div className="text-center py-12 text-neutral-400">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nog geen recente activiteit</p>
        <p className="text-sm mt-2">Voeg je eerste product toe om te beginnen</p>
      </div>
    </div>
  )
}

function ShopProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Producten</h3>
        <a
          href={`${SHOP_ADMIN_URL}/products`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw product</span>
        </a>
      </div>

      {/* Products will be loaded from shop database */}
      <div className="text-center py-12 text-neutral-400">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Producten worden geladen...</p>
        <a
          href={SHOP_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 mt-4"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open volledige productbeheer</span>
        </a>
      </div>
    </div>
  )
}

function ShopOrders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Bestellingen</h3>
        <a
          href={`${SHOP_ADMIN_URL}/orders`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Alle bestellingen</span>
        </a>
      </div>

      {/* Orders will be loaded from shop database */}
      <div className="text-center py-12 text-neutral-400">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nog geen bestellingen</p>
      </div>
    </div>
  )
}

function ShopSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Shop instellingen</h3>

      <div className="grid gap-4">
        <SettingCard
          title="Stripe koppeling"
          description="Koppel je Stripe account voor betalingen"
          action="Configureren"
          href={`${SHOP_ADMIN_URL}/settings`}
        />
        <SettingCard
          title="Verzendkosten"
          description="Stel verzendkosten en -zones in"
          action="Beheren"
          href={`${SHOP_ADMIN_URL}/settings`}
        />
        <SettingCard
          title="Email templates"
          description="Pas orderbevestigingen en notificaties aan"
          action="Aanpassen"
          href={`${SHOP_ADMIN_URL}/settings`}
        />
      </div>
    </div>
  )
}

function SettingCard({
  title,
  description,
  action,
  href,
}: {
  title: string
  description: string
  action: string
  href: string
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
      <div>
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
      >
        <Settings className="w-4 h-4" />
        <span>{action}</span>
      </a>
    </div>
  )
}
