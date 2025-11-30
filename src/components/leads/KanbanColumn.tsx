import { LeadCard } from './LeadCard'
import type { Lead, LeadStatus } from '../../hooks/useLeads'

interface KanbanColumnProps {
  status: LeadStatus
  label: string
  color: string
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onDrop: (leadId: string, newStatus: LeadStatus) => void
}

export function KanbanColumn({
  status,
  label,
  color,
  leads,
  onLeadClick,
  onDrop,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-white/5')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-white/5')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-white/5')
    const leadId = e.dataTransfer.getData('text/plain')
    if (leadId) {
      onDrop(leadId, status)
    }
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="flex flex-col min-w-[280px] max-w-[320px] bg-neutral-950 rounded-2xl border border-neutral-800"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full bg-${color}-400`} />
          <h3 className="text-[13px] font-medium text-neutral-200">{label}</h3>
        </div>
        <span className="text-[11px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {leads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[12px] text-neutral-600">Geen leads</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => handleDragStart(e, lead.id)}
            >
              <LeadCard
                lead={lead}
                onClick={() => onLeadClick(lead)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
