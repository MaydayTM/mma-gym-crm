import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '../components/ui'
import { KanbanColumn } from '../components/leads/KanbanColumn'
import { NewLeadForm } from '../components/leads/NewLeadForm'
import { LeadDetailModal } from '../components/leads/LeadDetailModal'
import { useLeadsByStatus, LEAD_STATUSES, type Lead, type LeadStatus } from '../hooks/useLeads'
import { useUpdateLead } from '../hooks/useUpdateLead'
import { usePermissions } from '../hooks/usePermissions'

export function Leads() {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const { canManageLeads } = usePermissions()
  const { data: leadsByStatus, leads, isLoading, error } = useLeadsByStatus()
  const { mutate: updateLead } = useUpdateLead()

  const handleDrop = (leadId: string, newStatus: LeadStatus) => {
    updateLead({
      id: leadId,
      data: { status: newStatus },
    })
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-white/5 rounded-xl w-32 animate-pulse" />
          <div className="h-12 bg-white/5 rounded-full w-36 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="min-w-[280px] h-[400px] bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6">
          <p className="text-rose-300 text-[14px]">
            Fout bij laden: {(error as Error).message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Leads</h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            {leads?.length ?? 0} leads in pipeline
          </p>
        </div>
        {canManageLeads && (
          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
          >
            <UserPlus size={18} strokeWidth={1.5} />
            <span>Nieuwe Lead</span>
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {LEAD_STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status.value}
            label={status.label}
            color={status.color}
            leads={leadsByStatus?.[status.value] || []}
            onLeadClick={handleLeadClick}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* New Lead Modal */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Nieuwe Lead"
        size="lg"
      >
        <NewLeadForm
          onSuccess={() => setIsNewLeadModalOpen(false)}
          onCancel={() => setIsNewLeadModalOpen(false)}
        />
      </Modal>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  )
}
