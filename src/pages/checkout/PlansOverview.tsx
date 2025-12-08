import { Link } from 'react-router-dom'
import { Loader2, ChevronRight } from 'lucide-react'
import { useAgeGroups } from '../../hooks/usePlans'

export function PlansOverview() {
  const { data: ageGroups, isLoading, error } = useAgeGroups()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6 max-w-md">
          <p className="text-rose-300 text-center">
            Er ging iets mis bij het laden. Probeer het later opnieuw.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-neutral-50 tracking-tight">
            Word lid van Reconnect Academy
          </h1>
          <p className="text-[16px] md:text-[18px] text-neutral-400 mt-4 max-w-2xl mx-auto">
            Kies je categorie en ontdek onze flexibele abonnementen.
            Geen contracten, maandelijks opzegbaar.
          </p>
        </div>
      </div>

      {/* Age Group Cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ageGroups?.map((group) => (
            <Link
              key={group.id}
              to={`/checkout/plans/${group.slug}`}
              className="group relative bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 hover:border-amber-300/50 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(251,191,36,0.15)]"
            >
              {/* Decorative gradient */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Category name */}
                <h2 className="text-[28px] font-bold text-neutral-50 mb-2">
                  {group.name}
                </h2>

                {/* Subtitle */}
                <p className="text-[14px] text-neutral-400 mb-6">
                  {group.subtitle}
                </p>

                {/* Starting price */}
                <div className="mb-6">
                  <span className="text-[14px] text-neutral-500">vanaf</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-bold text-amber-300">
                      €{group.starting_price}
                    </span>
                    <span className="text-[16px] text-neutral-400">/maand</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-amber-300 group-hover:gap-3 transition-all">
                  <span className="text-[15px] font-medium">Bekijk opties</span>
                  <ChevronRight size={18} strokeWidth={2} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Beurtenkaarten link */}
        <div className="mt-12 text-center">
          <p className="text-neutral-400 mb-4">
            Liever eerst proberen zonder abonnement?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/checkout/daypass"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-neutral-200 hover:border-amber-300/50 hover:text-amber-300 transition"
            >
              Dagpas - €15
            </Link>
            <Link
              to="/checkout/punch-card/5"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-neutral-200 hover:border-amber-300/50 hover:text-amber-300 transition"
            >
              5-Beurtenkaart - €70
            </Link>
            <Link
              to="/checkout/punch-card/10"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-neutral-200 hover:border-amber-300/50 hover:text-amber-300 transition"
            >
              10-Beurtenkaart - €120
            </Link>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-white/10 bg-neutral-900/50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-amber-300 font-medium mb-1">Flexibel</p>
              <p className="text-[13px] text-neutral-400">Maandelijks opzegbaar, geen verplichtingen</p>
            </div>
            <div>
              <p className="text-amber-300 font-medium mb-1">Gezinskorting</p>
              <p className="text-[13px] text-neutral-400">Tot €30 korting per extra gezinslid</p>
            </div>
            <div>
              <p className="text-amber-300 font-medium mb-1">Gratis proefles</p>
              <p className="text-[13px] text-neutral-400">Kom eerst sfeer proeven, beslis daarna</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
