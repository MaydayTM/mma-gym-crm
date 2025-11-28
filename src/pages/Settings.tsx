import { Settings as SettingsIcon, Building2, Users, Bell, Palette, Shield, Plug } from 'lucide-react'

const settingsSections = [
  {
    title: 'Gym Profiel',
    description: 'Naam, adres, contact en openingstijden',
    icon: Building2,
    color: 'amber',
  },
  {
    title: 'Gebruikers & Rollen',
    description: 'Team toegang en permissies beheren',
    icon: Users,
    color: 'emerald',
  },
  {
    title: 'Notificaties',
    description: 'Email en push notificatie voorkeuren',
    icon: Bell,
    color: 'sky',
  },
  {
    title: 'Branding',
    description: 'Logo, kleuren en email templates',
    icon: Palette,
    color: 'purple',
  },
  {
    title: 'Beveiliging',
    description: 'Wachtwoord, 2FA en sessie beheer',
    icon: Shield,
    color: 'rose',
  },
  {
    title: 'Integraties',
    description: 'Stripe, webhooks en API sleutels',
    icon: Plug,
    color: 'orange',
  },
]

const colorClasses: Record<string, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-300' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-300' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-300' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-300' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-300' },
}

export function Settings() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Instellingen</h1>
        <p className="text-[14px] text-neutral-400 mt-1">Configureer je gym en account</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const colors = colorClasses[section.color]
          return (
            <div
              key={section.title}
              className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 hover:border-amber-300/70 hover:bg-neutral-900 transition cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center`}>
                <section.icon className={colors.text} size={22} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-neutral-50 tracking-tight group-hover:text-amber-300 transition">
                  {section.title}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{section.description}</p>
              </div>
            </div>
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
          Instellingen worden momenteel ontwikkeld. Binnenkort kun je hier je gym volledig configureren.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/40">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-amber-300">In ontwikkeling</span>
        </div>
      </div>
    </div>
  )
}
