import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Package, Percent, Users, Gift, Settings, Layers } from 'lucide-react'
import { PricingMatrixTab } from '../components/subscriptions/PricingMatrixTab'
import { OneTimeProductsTab } from '../components/subscriptions/OneTimeProductsTab'
import { DiscountsTab } from '../components/subscriptions/DiscountsTab'
import { AgeGroupsTab } from '../components/subscriptions/AgeGroupsTab'
import { PlanTypesTab } from '../components/subscriptions/PlanTypesTab'
import { AddonsTab } from '../components/subscriptions/AddonsTab'

type TabId = 'groups' | 'types' | 'pricing' | 'one-time' | 'discounts' | 'addons'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  description: string
}

const tabs: Tab[] = [
  {
    id: 'groups',
    label: '1. Leeftijdsgroepen',
    icon: <Users size={18} />,
    description: 'Eerst: Kids, Studenten, Volwassenen'
  },
  {
    id: 'types',
    label: '2. Types',
    icon: <Layers size={18} />,
    description: 'Dan: Basis, All-In, etc.'
  },
  {
    id: 'pricing',
    label: '3. Prijzen',
    icon: <Package size={18} />,
    description: 'Tot slot: Prijzen per combinatie'
  },
  {
    id: 'one-time',
    label: 'Dagpassen',
    icon: <Gift size={18} />,
    description: 'Eenmalige producten'
  },
  {
    id: 'discounts',
    label: 'Kortingen',
    icon: <Percent size={18} />,
    description: 'Kortingen en acties'
  },
  {
    id: 'addons',
    label: 'Add-ons',
    icon: <Settings size={18} />,
    description: 'Verzekering, materiaalhuur'
  }
]

export function SubscriptionsManage() {
  const [activeTab, setActiveTab] = useState<TabId>('groups')

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/subscriptions"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">
            Abonnementen Beheren
          </h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            Configureer prijzen, kortingen en producten voor de checkout
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium transition ${
              activeTab === tab.id
                ? 'bg-amber-300 text-neutral-950'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 p-6">
        {activeTab === 'groups' && <AgeGroupsTab />}
        {activeTab === 'types' && <PlanTypesTab />}
        {activeTab === 'pricing' && <PricingMatrixTab />}
        {activeTab === 'one-time' && <OneTimeProductsTab />}
        {activeTab === 'discounts' && <DiscountsTab />}
        {activeTab === 'addons' && <AddonsTab />}
      </div>
    </div>
  )
}
