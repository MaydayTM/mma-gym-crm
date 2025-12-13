import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Package, Percent, Users, Gift, Settings } from 'lucide-react'
import { PricingMatrixTab } from '../components/subscriptions/PricingMatrixTab'
import { OneTimeProductsTab } from '../components/subscriptions/OneTimeProductsTab'
import { DiscountsTab } from '../components/subscriptions/DiscountsTab'
import { AgeGroupsTab } from '../components/subscriptions/AgeGroupsTab'
import { AddonsTab } from '../components/subscriptions/AddonsTab'

type TabId = 'pricing' | 'one-time' | 'discounts' | 'groups' | 'addons'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  description: string
}

const tabs: Tab[] = [
  {
    id: 'pricing',
    label: 'Abonnementen',
    icon: <Package size={18} />,
    description: 'Prijzen en looptijden beheren'
  },
  {
    id: 'one-time',
    label: 'Dagpassen & Beurten',
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
    id: 'groups',
    label: 'Leeftijdsgroepen',
    icon: <Users size={18} />,
    description: 'Kids, Studenten, Volwassenen'
  },
  {
    id: 'addons',
    label: 'Add-ons',
    icon: <Settings size={18} />,
    description: 'Verzekering, materiaalhuur'
  }
]

export function SubscriptionsManage() {
  const [activeTab, setActiveTab] = useState<TabId>('pricing')

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
        {activeTab === 'pricing' && <PricingMatrixTab />}
        {activeTab === 'one-time' && <OneTimeProductsTab />}
        {activeTab === 'discounts' && <DiscountsTab />}
        {activeTab === 'groups' && <AgeGroupsTab />}
        {activeTab === 'addons' && <AddonsTab />}
      </div>
    </div>
  )
}
