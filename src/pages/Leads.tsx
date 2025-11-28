import { UserPlus, TrendingUp } from 'lucide-react'

export function Leads() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Leads</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Lead pipeline beheer</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
        >
          <UserPlus size={18} strokeWidth={1.5} />
          <span>Nieuwe Lead</span>
        </button>
      </div>

      {/* Coming Soon Card */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-12 text-center"
        style={{
          position: 'relative',
          '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
          <TrendingUp className="text-amber-300" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-[20px] font-medium text-neutral-50">Lead Pipeline</h3>
        <p className="text-[14px] text-neutral-500 mt-2 max-w-md mx-auto">
          Beheer je leads van eerste contact tot conversie. Kanban board, automatische follow-ups en conversie tracking.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/40">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-amber-300">Komt binnenkort</span>
        </div>
      </div>
    </div>
  )
}
