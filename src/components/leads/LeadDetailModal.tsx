import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  TrendingUp,
  Loader2,
  UserPlus,
  CheckCircle,
} from 'lucide-react'
import { useUpdateLead } from '../../hooks/useUpdateLead'
import { useConvertLead } from '../../hooks/useConvertLead'
import { LEAD_STATUSES, LEAD_SOURCES, type Lead, type LeadStatus } from '../../hooks/useLeads'

interface LeadDetailModalProps {
  lead: Lead
  isOpen: boolean
  onClose: () => void
}

const DISCIPLINES = [
  { value: 'bjj', label: 'BJJ' },
  { value: 'mma', label: 'MMA' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'muay_thai', label: 'Muay Thai' },
  { value: 'boksen', label: 'Boksen' },
  { value: 'kids', label: 'Jeugdlessen' },
]

export function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  const navigate = useNavigate()
  const { mutate: updateLead, isPending } = useUpdateLead()
  const { mutate: convertLead, isPending: isConverting } = useConvertLead()

  const [formData, setFormData] = useState({
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || '',
    status: (lead.status || 'new') as LeadStatus,
    interested_in: lead.interested_in || [],
    trial_date: lead.trial_date || '',
    follow_up_date: lead.follow_up_date || '',
    notes: lead.notes || '',
    lost_reason: lead.lost_reason || '',
  })

  useEffect(() => {
    setFormData({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || '',
      status: (lead.status || 'new') as LeadStatus,
      interested_in: lead.interested_in || [],
      trial_date: lead.trial_date || '',
      follow_up_date: lead.follow_up_date || '',
      notes: lead.notes || '',
      lost_reason: lead.lost_reason || '',
    })
  }, [lead])

  if (!isOpen) return null

  const handleSave = () => {
    updateLead(
      {
        id: lead.id,
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          source: formData.source || null,
          status: formData.status,
          interested_in: formData.interested_in.length > 0 ? formData.interested_in : null,
          trial_date: formData.trial_date || null,
          follow_up_date: formData.follow_up_date || null,
          notes: formData.notes || null,
          lost_reason: formData.lost_reason || null,
        },
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }))
    // Auto-save status change
    updateLead({
      id: lead.id,
      data: { status: newStatus },
    })
  }

  const handleDisciplineToggle = (discipline: string) => {
    setFormData((prev) => ({
      ...prev,
      interested_in: prev.interested_in.includes(discipline)
        ? prev.interested_in.filter((d) => d !== discipline)
        : [...prev.interested_in, discipline],
    }))
  }

  const inputClasses =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[14px]'
  const labelClasses = 'block text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg h-full bg-neutral-950 border-l border-neutral-800 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex text-[14px] font-medium text-amber-300 bg-amber-500/10 w-10 h-10 rounded-xl items-center justify-center">
                <TrendingUp size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[18px] font-medium text-neutral-50">
                  {formData.first_name} {formData.last_name}
                </h2>
                <p className="text-[12px] text-neutral-500">Lead details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
            >
              <X size={18} className="text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Status Buttons */}
          <div className="space-y-2">
            <label className={labelClasses}>Status</label>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => handleStatusChange(status.value)}
                  className={`px-3 py-1.5 rounded-full text-[12px] border transition-all ${formData.status === status.value
                      ? `bg-${status.color}-500/20 border-${status.color}-500/50 text-${status.color}-300`
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                    }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
              Contact
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className={labelClasses}>
                  Voornaam
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="last_name" className={labelClasses}>
                  Achternaam
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className={labelClasses}>
                Telefoon
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
              Lead Details
            </h3>

            <div>
              <label htmlFor="source" className={labelClasses}>
                Bron
              </label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="">Selecteer...</option>
                {LEAD_SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Interesse in</label>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDisciplineToggle(d.value)}
                    className={`px-3 py-1.5 rounded-full text-[12px] border transition-all ${formData.interested_in.includes(d.value)
                        ? 'bg-amber-300 border-amber-300 text-neutral-950 font-medium'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-amber-300/70'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trial_date" className={labelClasses}>
                  Proefles datum
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    type="datetime-local"
                    id="trial_date"
                    name="trial_date"
                    value={formData.trial_date}
                    onChange={handleChange}
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="follow_up_date" className={labelClasses}>
                  Follow-up datum
                </label>
                <input
                  type="date"
                  id="follow_up_date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
              Notities
            </h3>
            <div className="relative">
              <MessageSquare
                size={16}
                className="absolute left-4 top-4 text-neutral-500"
              />
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className={`${inputClasses} pl-11`}
                placeholder="Notities over deze lead..."
              />
            </div>
          </div>

          {/* Lost Reason (only show if status is lost) */}
          {formData.status === 'lost' && (
            <div className="space-y-4">
              <h3 className="text-[11px] font-medium text-rose-400 uppercase tracking-[0.22em]">
                Reden verloren
              </h3>
              <textarea
                id="lost_reason"
                name="lost_reason"
                value={formData.lost_reason}
                onChange={handleChange}
                rows={2}
                className={inputClasses}
                placeholder="Waarom is deze lead verloren gegaan?"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-neutral-950 border-t border-neutral-800 px-6 py-4">
          <div className="flex justify-between gap-3">
            {formData.status !== 'converted' ? (
              <button
                type="button"
                disabled={isConverting}
                onClick={() => {
                  convertLead(
                    { lead },
                    {
                      onSuccess: (result) => {
                        onClose()
                        navigate(`/members/${result.memberId}`)
                      },
                    }
                  )
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[13px] hover:bg-emerald-500/20 transition disabled:opacity-50"
              >
                {isConverting ? (
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                ) : (
                  <UserPlus size={16} strokeWidth={1.5} />
                )}
                <span>{isConverting ? 'Converteren...' : 'Converteer naar lid'}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 text-emerald-300 text-[13px]">
                <CheckCircle size={16} strokeWidth={1.5} />
                <span>Geconverteerd naar lid</span>
              </div>
            )}

            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 text-[13px] hover:bg-neutral-800 transition"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-300 text-neutral-950 text-[13px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {isPending ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
