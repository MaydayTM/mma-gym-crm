import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateMember } from '../../hooks/useCreateMember'

interface NewMemberFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const DISCIPLINES = [
  { value: 'bjj', label: 'BJJ' },
  { value: 'mma', label: 'MMA' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'muay_thai', label: 'Muay Thai' },
]

const BELT_COLORS = [
  { value: 'white', label: 'Wit' },
  { value: 'grey', label: 'Grijs' },
  { value: 'yellow', label: 'Geel' },
  { value: 'orange', label: 'Oranje' },
  { value: 'green', label: 'Groen' },
  { value: 'blue', label: 'Blauw' },
  { value: 'purple', label: 'Paars' },
  { value: 'brown', label: 'Bruin' },
  { value: 'black', label: 'Zwart' },
]

export function NewMemberForm({ onSuccess, onCancel }: NewMemberFormProps) {
  const { mutate: createMember, isPending, error } = useCreateMember()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    street: '',
    city: '',
    zip_code: '',
    disciplines: [] as string[],
    belt_color: '',
    belt_stripes: 0,
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createMember(
      {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        street: formData.street || null,
        city: formData.city || null,
        zip_code: formData.zip_code || null,
        disciplines: formData.disciplines.length > 0 ? formData.disciplines : null,
        belt_color: formData.belt_color || null,
        belt_stripes: formData.belt_stripes,
        notes: formData.notes || null,
        status: 'active',
        role: 'fighter',
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
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter((d) => d !== discipline)
        : [...prev.disciplines, discipline],
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

      {/* Persoonlijke info */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Persoonlijke informatie
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
              Achternaam *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className={inputClasses}
              placeholder="Janssen"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birth_date" className={labelClasses}>
              Geboortedatum
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="gender" className={labelClasses}>
              Geslacht
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Selecteer...</option>
              <option value="man">Man</option>
              <option value="vrouw">Vrouw</option>
              <option value="anders">Anders</option>
              <option value="onbekend">Zeg ik liever niet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Adres */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Adres
        </h3>

        <div>
          <label htmlFor="street" className={labelClasses}>
            Straat en huisnummer
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Kerkstraat 123"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="zip_code" className={labelClasses}>
              Postcode
            </label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              className={inputClasses}
              placeholder="9300"
            />
          </div>

          <div>
            <label htmlFor="city" className={labelClasses}>
              Gemeente
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Aalst"
            />
          </div>
        </div>
      </div>

      {/* Gym info */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Gym informatie
        </h3>

        <div>
          <label className={labelClasses}>Disciplines</label>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleDisciplineToggle(d.value)}
                className={`px-4 py-2 rounded-full text-[13px] border transition-all ${
                  formData.disciplines.includes(d.value)
                    ? 'bg-amber-300 border-amber-300 text-neutral-950 font-medium'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-amber-300/70'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="belt_color" className={labelClasses}>
              Gordel kleur
            </label>
            <select
              id="belt_color"
              name="belt_color"
              value={formData.belt_color}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Geen gordel</option>
              {BELT_COLORS.map((belt) => (
                <option key={belt.value} value={belt.value}>
                  {belt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="belt_stripes" className={labelClasses}>
              Strepen
            </label>
            <select
              id="belt_stripes"
              name="belt_stripes"
              value={formData.belt_stripes}
              onChange={handleChange}
              className={inputClasses}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'streep' : 'strepen'}
                </option>
              ))}
            </select>
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
            placeholder="Extra informatie over dit lid..."
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
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '9999px',
          } as React.CSSProperties}
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition disabled:opacity-50"
        >
          {isPending && <Loader2 size={18} className="animate-spin" />}
          {isPending ? 'Opslaan...' : 'Lid toevoegen'}
        </button>
      </div>
    </form>
  )
}
