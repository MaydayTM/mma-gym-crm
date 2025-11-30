import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateLead } from '../../hooks/useCreateLead'
import { LEAD_SOURCES } from '../../hooks/useLeads'

interface NewLeadFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const DISCIPLINES = [
  { value: 'bjj', label: 'BJJ' },
  { value: 'mma', label: 'MMA' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'muay_thai', label: 'Muay Thai' },
  { value: 'kids', label: 'Jeugdlessen' },
]

export function NewLeadForm({ onSuccess, onCancel }: NewLeadFormProps) {
  const { mutate: createLead, isPending, error } = useCreateLead()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: '',
    source_detail: '',
    interested_in: [] as string[],
    trial_date: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createLead(
      {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        source: formData.source || null,
        source_detail: formData.source_detail || null,
        interested_in: formData.interested_in.length > 0 ? formData.interested_in : null,
        trial_date: formData.trial_date || null,
        notes: formData.notes || null,
      },
      {
        onSuccess: () => {
          onSuccess()
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl">
          <p className="text-rose-300 text-[14px]">{(error as Error).message}</p>
        </div>
      )}

      {/* Contact info */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Contact informatie
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className={labelClasses}>
              Voornaam *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="Jan"
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
              placeholder="Janssen"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              placeholder="jan@voorbeeld.be"
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClasses}>
              Telefoon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses}
              placeholder="+32 470 12 34 56"
            />
          </div>
        </div>
      </div>

      {/* Lead info */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Lead informatie
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="trial_date" className={labelClasses}>
              Proefles datum
            </label>
            <input
              type="datetime-local"
              id="trial_date"
              name="trial_date"
              value={formData.trial_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Interesse in</label>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleDisciplineToggle(d.value)}
                className={`px-4 py-2 rounded-full text-[13px] border transition-all ${
                  formData.interested_in.includes(d.value)
                    ? 'bg-amber-300 border-amber-300 text-neutral-950 font-medium'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-amber-300/70'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClasses}>
            Notities
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className={inputClasses}
            placeholder="Eerste contact via Instagram DM, wil proeflies BJJ..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition disabled:opacity-50"
        >
          {isPending && <Loader2 size={18} className="animate-spin" />}
          {isPending ? 'Opslaan...' : 'Lead toevoegen'}
        </button>
      </div>
    </form>
  )
}
