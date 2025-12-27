import { useState } from 'react'
import { Settings as SettingsIcon, Building2, Users, Bell, Palette, Shield, CreditCard, Calendar } from 'lucide-react'
import { PaymentSettings } from '../components/settings/PaymentSettings'
import { ScheduleSettings } from '../components/settings/ScheduleSettings'

type SettingsTab = 'overview' | 'payments' | 'schedule' | 'profile' | 'users' | 'notifications' | 'branding' | 'security'

const settingsSections = [
  {
    id: 'payments' as SettingsTab,
    title: 'Betalingen',
    description: 'Stripe/Mollie configuratie voor shop en abonnementen',
    icon: CreditCard,
    color: 'amber',
    available: true,
  },
  {
    id: 'schedule' as SettingsTab,
    title: 'Rooster',
    description: 'Tracks, disciplines en rooster instellingen',
    icon: Calendar,
    color: 'sky',
    available: true,
  },
  {
    id: 'profile' as SettingsTab,
    title: 'Gym Profiel',
    description: 'Naam, adres, contact en openingstijden',
    icon: Building2,
    color: 'emerald',
    available: false,
  },
  {
    id: 'users' as SettingsTab,
    title: 'Gebruikers & Rollen',
    description: 'Team toegang en permissies beheren',
    icon: Users,
    color: 'sky',
    available: false,
  },
  {
    id: 'notifications' as SettingsTab,
    title: 'Notificaties',
    description: 'Email en push notificatie voorkeuren',
    icon: Bell,
    color: 'purple',
    available: false,
  },
  {
    id: 'branding' as SettingsTab,
    title: 'Branding',
    description: 'Logo, kleuren en email templates',
    icon: Palette,
    color: 'rose',
    available: false,
  },
  {
    id: 'security' as SettingsTab,
    title: 'Beveiliging',
    description: 'Wachtwoord, 2FA en sessie beheer',
    icon: Shield,
    color: 'orange',
    available: false,
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30' },
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')

  const handleSectionClick = (section: typeof settingsSections[0]) => {
    if (section.available) {
      setActiveTab(section.id)
    }
  }

  // Render the active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <PaymentSettings />
      case 'schedule':
        return <ScheduleSettings />
      case 'overview':
      default:
        return <SettingsOverview onSectionClick={handleSectionClick} />
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Instellingen</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Configureer je gym en account</p>
        </div>
        {activeTab !== 'overview' && (
          <button
            onClick={() => setActiveTab('overview')}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Terug naar overzicht
          </button>
        )}
      </div>

      {/* Tab Navigation (only show when not on overview) */}
      {activeTab !== 'overview' && (
        <div className="border-b border-white/10">
          <nav className="flex gap-6">
            {settingsSections.filter(s => s.available).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === section.id
                    ? 'text-amber-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {section.title}
                {activeTab === section.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  )
}

// Overview component showing all settings sections as cards
function SettingsOverview({ onSectionClick }: { onSectionClick: (section: typeof settingsSections[0]) => void }) {
  return (
    <>
      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const colors = colorClasses[section.color]
          return (
            <button
              key={section.title}
              onClick={() => onSectionClick(section)}
              disabled={!section.available}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition group text-left ${
                section.available
                  ? 'border-neutral-800 bg-neutral-950 hover:border-amber-300/70 hover:bg-neutral-900 cursor-pointer'
                  : 'border-neutral-800/50 bg-neutral-950/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center`}>
                <section.icon className={colors.text} size={22} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-medium tracking-tight transition ${
                    section.available
                      ? 'text-neutral-50 group-hover:text-amber-300'
                      : 'text-neutral-400'
                  }`}>
                    {section.title}
                  </p>
                  {section.available && (
                    <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-green-500/10 text-green-400 rounded">
                      Actief
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{section.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Coming Soon Notice */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 text-center"
        style={{
          position: 'relative',
          '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="w-12 h-12 mx-auto bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
          <SettingsIcon className="text-neutral-500" size={22} strokeWidth={1.5} />
        </div>
        <p className="text-[14px] text-neutral-500 max-w-md mx-auto">
          Meer instellingen worden momenteel ontwikkeld. <strong className="text-amber-300">Betalingen</strong> is nu beschikbaar!
        </p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/40">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-amber-300">In ontwikkeling</span>
        </div>
      </div>
    </>
  )
}
