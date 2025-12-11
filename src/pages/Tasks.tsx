import { Sparkles, Bot, Zap, Bell, Calendar, TrendingUp } from 'lucide-react'

const upcomingFeatures = [
  {
    icon: Bot,
    title: 'AI Lead Scoring',
    description: 'Automatisch leads prioriteren op basis van engagement en conversiekans',
  },
  {
    icon: Bell,
    title: 'Slimme Herinneringen',
    description: 'Automatische follow-ups voor verlopen abonnementen en inactieve leden',
  },
  {
    icon: Calendar,
    title: 'Rooster Optimalisatie',
    description: 'AI-suggesties voor lesplanning op basis van bezettingsdata',
  },
  {
    icon: TrendingUp,
    title: 'Churn Predictie',
    description: 'Voorspel welke leden risico lopen om op te zeggen',
  },
]

export function Tasks() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center pt-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-amber-400/30">
          <Sparkles className="w-10 h-10 text-amber-400" />
        </div>
        <h1 className="text-[32px] font-semibold text-neutral-50 tracking-tight">
          Smart Automations
        </h1>
        <p className="text-[16px] text-neutral-400 mt-3 max-w-lg mx-auto">
          Hier komen de slimme functies en AI-automatisaties van je CRM.
          Laat de software het werk doen, zodat jij je kunt focussen op je leden.
        </p>
      </div>

      {/* Coming Soon Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-[13px] font-medium text-amber-300">Coming Soon</span>
        </div>
      </div>

      {/* Feature Preview Grid */}
      <div className="grid md:grid-cols-2 gap-4 pt-4">
        {upcomingFeatures.map((feature) => (
          <div
            key={feature.title}
            className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-neutral-200">{feature.title}</h3>
                <p className="text-[13px] text-neutral-500 mt-1">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="text-center pt-4 pb-8">
        <p className="text-[13px] text-neutral-500">
          Heb je ideeën voor automatisaties? Laat het ons weten!
        </p>
      </div>
    </div>
  )
}
