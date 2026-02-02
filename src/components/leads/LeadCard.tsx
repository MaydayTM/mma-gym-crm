import { useMemo } from 'react'
import { Calendar, Clock } from 'lucide-react'
import type { Lead } from '../../hooks/useLeads'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  isDragging?: boolean
}

// Helper to get stable "now" value (computed once on initial render)
const getNow = () => Date.now()

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  // Calculate days since created (useMemo with empty deps to compute once on mount)
  const daysSinceCreated = useMemo(() => {
    if (!lead.created_at) return 0
    return Math.floor((getNow() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
    // Empty deps means this computes once on mount and never re-computes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      onClick={onClick}
      className={`
        bg-neutral-900 border border-neutral-800 rounded-2xl p-4 cursor-pointer
        hover:border-amber-300/50 hover:bg-neutral-800/50 transition-all
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
      `}
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 flex text-[11px] font-medium text-amber-300 bg-amber-500/10 w-9 h-9 rounded-xl items-center justify-center">
          {lead.first_name?.charAt(0) || '?'}
          {lead.last_name?.charAt(0) || ''}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-neutral-50 truncate">
            {lead.first_name} {lead.last_name}
          </p>
          {lead.email && (
            <p className="text-[11px] text-neutral-500 truncate">{lead.email}</p>
          )}
        </div>
      </div>

      {/* Source Badge */}
      {lead.source && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getSourceClasses(lead.source)}`}>
            {lead.source}
          </span>
        </div>
      )}

      {/* Interested In */}
      {lead.interested_in && lead.interested_in.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.interested_in.map((discipline) => (
            <span
              key={discipline}
              className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] uppercase"
            >
              {discipline}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Trial date or days since */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        {lead.trial_date ? (
          <div className="flex items-center gap-1 text-amber-300/80">
            <Calendar size={12} strokeWidth={1.5} />
            <span>{formatDate(lead.trial_date)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Clock size={12} strokeWidth={1.5} />
            <span>{daysSinceCreated}d geleden</span>
          </div>
        )}

        {lead.phone && (
          <span className="text-neutral-600">{lead.phone}</span>
        )}
      </div>
    </div>
  )
}

function getSourceClasses(source: string): string {
  const sources: Record<string, string> = {
    instagram: 'bg-pink-500/10 text-pink-300 border border-pink-500/30',
    facebook: 'bg-blue-500/10 text-blue-300 border border-blue-500/30',
    website: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    walk_in: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    referral: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
    google: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
  }
  return sources[source] || 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/30'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
  })
}
