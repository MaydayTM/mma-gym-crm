import { useState, useEffect, useRef } from 'react'
import { Loader2, Upload, Sparkles, X, Lock } from 'lucide-react'
import { useUpdateMember } from '../../hooks/useUpdateMember'
import { useUploadProfilePicture } from '../../hooks/useUploadProfilePicture'
import { useDisciplines } from '../../hooks/useDisciplines'
import { usePermissions, ROLE_INFO, type Role } from '../../hooks/usePermissions'
import type { Member } from '../../hooks/useMembers'

interface EditMemberFormProps {
  member: Member
  onSuccess: () => void
  onCancel: () => void
}

// Gebruik ROLE_INFO van usePermissions voor consistentie
const ROLES: { value: Role; label: string }[] = [
  { value: 'fighter', label: ROLE_INFO.fighter.label },
  { value: 'coach', label: ROLE_INFO.coach.label },
  { value: 'coordinator', label: ROLE_INFO.coordinator.label },
  { value: 'medewerker', label: ROLE_INFO.medewerker.label },
  { value: 'admin', label: ROLE_INFO.admin.label },
  { value: 'fan', label: `${ROLE_INFO.fan.label} (geen gym toegang)` },
]

const STATUSES = [
  { value: 'active', label: 'Actief' },
  { value: 'frozen', label: 'Bevroren' },
  { value: 'cancelled', label: 'Opgezegd' },
  { value: 'lead', label: 'Lead' },
]

export function EditMemberForm({ member, onSuccess, onCancel }: EditMemberFormProps) {
  const { mutate: updateMember, isPending, error } = useUpdateMember()
  const { upload: uploadPicture, isUploading, progress } = useUploadProfilePicture()
  const { data: disciplines = [], isLoading: disciplinesLoading } = useDisciplines()
  const { canManageRoles, canAssignRole } = usePermissions()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    member.profile_picture_url
  )
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone ?? '',
    birth_date: member.birth_date ?? '',
    gender: member.gender ?? '',
    street: member.street ?? '',
    city: member.city ?? '',
    zip_code: member.zip_code ?? '',
    disciplines: member.disciplines ?? [],
    role: member.role ?? 'fighter',
    status: member.status ?? 'active',
    notes: member.notes ?? '',
  })

  useEffect(() => {
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone ?? '',
      birth_date: member.birth_date ?? '',
      gender: member.gender ?? '',
      street: member.street ?? '',
      city: member.city ?? '',
      zip_code: member.zip_code ?? '',
      disciplines: member.disciplines ?? [],
      role: member.role ?? 'fighter',
      status: member.status ?? 'active',
      notes: member.notes ?? '',
    })
  }, [member])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    updateMember(
      {
        id: member.id,
        data: {
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
          role: formData.role,
          status: formData.status,
          notes: formData.notes || null,
        },
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setUploadError('Alleen JPG, PNG, WebP of GIF bestanden zijn toegestaan')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bestand is te groot (max 5MB)')
      return
    }

    setUploadError(null)

    try {
      const result = await uploadPicture(member.id, file)
      setProfilePictureUrl(result.url)

      // Update member with new profile picture URL
      updateMember({
        id: member.id,
        data: { profile_picture_url: result.url },
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload mislukt')
    }
  }

  const handleRemovePicture = () => {
    setProfilePictureUrl(null)
    updateMember({
      id: member.id,
      data: { profile_picture_url: null },
    })
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

      {/* Profile Picture Upload */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.22em]">
          Profielfoto
        </h3>

        <div className="flex items-start gap-6">
          {/* Current Picture / Upload Preview */}
          <div className="relative">
            {profilePictureUrl ? (
              <div className="relative">
                <img
                  src={profilePictureUrl}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-24 h-24 rounded-2xl object-cover border border-white/10"
                />
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center">
                <span className="text-[24px] font-medium text-neutral-400">
                  {member.first_name.charAt(0)}
                  {member.last_name.charAt(0)}
                </span>
              </div>
            )}

            {/* Upload Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 size={20} className="animate-spin text-amber-300 mx-auto" />
                  <span className="text-[11px] text-neutral-300 mt-1 block">{progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Buttons */}
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-200 text-[13px] hover:bg-white/10 hover:border-amber-300/50 transition disabled:opacity-50"
              >
                <Upload size={16} strokeWidth={1.5} />
                <span>Upload foto</span>
              </button>

              <button
                type="button"
                disabled
                title="Binnenkort beschikbaar"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[13px] cursor-not-allowed opacity-60"
              >
                <Sparkles size={16} strokeWidth={1.5} />
                <span>Fighter Profile</span>
              </button>
            </div>

            <p className="text-[11px] text-neutral-500">
              JPG, PNG, WebP of GIF. Max 5MB.
            </p>

            {uploadError && (
              <p className="text-[12px] text-rose-400">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className={labelClasses}>
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={inputClasses}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

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
          <label htmlFor="role" className={labelClasses}>
            Rol
            {!canManageRoles && (
              <span className="ml-2 text-neutral-600 normal-case tracking-normal">
                (alleen admin)
              </span>
            )}
          </label>
          {canManageRoles ? (
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={inputClasses}
            >
              {ROLES.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                  disabled={!canAssignRole(role.value)}
                >
                  {role.label}
                  {!canAssignRole(role.value) ? ' (geen toegang)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <div className={`${inputClasses} flex items-center justify-between cursor-not-allowed opacity-75`}>
                <span>{ROLE_INFO[formData.role as Role]?.label || formData.role}</span>
                <Lock size={16} className="text-neutral-500" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Neem contact op met een administrator om de rol te wijzigen.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className={labelClasses}>Disciplines</label>
          {disciplinesLoading ? (
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>Disciplines laden...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => handleDisciplineToggle(d.slug)}
                  className={`px-4 py-2 rounded-full text-[13px] border transition-all ${
                    formData.disciplines.includes(d.slug)
                      ? 'bg-amber-300 border-amber-300 text-neutral-950 font-medium'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-amber-300/70'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
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
            '--border-gradient':
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
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
          {isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </form>
  )
}
