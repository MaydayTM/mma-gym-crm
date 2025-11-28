import { useState, useCallback } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Modal } from '../ui'
import { useImportMembers } from '../../hooks/useImportMembers'

interface ImportMembersModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ParsedMember {
  first_name: string
  last_name: string
  email: string
  phone?: string
  birth_date?: string
  gender?: string
  street?: string
  zip_code?: string
  city?: string
  disciplines?: string[]
  belt_color?: string
  belt_stripes?: number
  notes?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export function ImportMembersModal({ isOpen, onClose }: ImportMembersModalProps) {
  const [_file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedMember[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')

  const { mutate: importMembers } = useImportMembers()

  const resetState = () => {
    setFile(null)
    setParsedData([])
    setErrors([])
    setStep('upload')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const parseCSV = useCallback((text: string): { data: ParsedMember[]; errors: ValidationError[] } => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      return { data: [], errors: [{ row: 0, field: 'file', message: 'Bestand is leeg of heeft geen data rijen' }] }
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const data: ParsedMember[] = []
    const errors: ValidationError[] = []

    // Map CSV headers to our fields
    const headerMap: Record<string, string> = {
      'voornaam': 'first_name',
      'achternaam': 'last_name',
      'email': 'email',
      'telefoon': 'phone',
      'geboortedatum': 'birth_date',
      'geslacht': 'gender',
      'straat': 'street',
      'postcode': 'zip_code',
      'gemeente': 'city',
      'disciplines': 'disciplines',
      'gordel_kleur': 'belt_color',
      'gordel_strepen': 'belt_stripes',
      'notities': 'notes',
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle quoted fields with commas
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const field = headerMap[header]
        if (field && values[index]) {
          let value: unknown = values[index]

          // Parse specific fields
          if (field === 'disciplines' && typeof value === 'string') {
            value = value.split(',').map(d => d.trim().toLowerCase())
          }
          if (field === 'belt_stripes' && typeof value === 'string') {
            value = parseInt(value, 10) || 0
          }
          if (field === 'gender' && typeof value === 'string') {
            value = value.toLowerCase()
          }
          if (field === 'belt_color' && typeof value === 'string') {
            value = value.toLowerCase()
          }

          row[field] = value
        }
      })

      // Validate required fields
      if (!row.first_name) {
        errors.push({ row: i + 1, field: 'voornaam', message: 'Voornaam is verplicht' })
      }
      if (!row.last_name) {
        errors.push({ row: i + 1, field: 'achternaam', message: 'Achternaam is verplicht' })
      }
      if (!row.email) {
        errors.push({ row: i + 1, field: 'email', message: 'Email is verplicht' })
      } else if (typeof row.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ row: i + 1, field: 'email', message: 'Ongeldig email formaat' })
      }

      if (row.first_name && row.last_name && row.email) {
        data.push({
          first_name: row.first_name as string,
          last_name: row.last_name as string,
          email: row.email as string,
          phone: row.phone as string | undefined,
          birth_date: row.birth_date as string | undefined,
          gender: row.gender as string | undefined,
          street: row.street as string | undefined,
          zip_code: row.zip_code as string | undefined,
          city: row.city as string | undefined,
          disciplines: row.disciplines as string[] | undefined,
          belt_color: row.belt_color as string | undefined,
          belt_stripes: row.belt_stripes as number | undefined,
          notes: row.notes as string | undefined,
        })
      }
    }

    return { data, errors }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { data, errors } = parseCSV(text)
      setParsedData(data)
      setErrors(errors)
      setStep('preview')
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = () => {
    if (parsedData.length === 0) return

    setStep('importing')

    const membersToImport = parsedData.map(member => ({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || null,
      birth_date: member.birth_date || null,
      gender: member.gender || null,
      street: member.street || null,
      zip_code: member.zip_code || null,
      city: member.city || null,
      disciplines: member.disciplines || null,
      belt_color: member.belt_color || null,
      belt_stripes: member.belt_stripes || 0,
      notes: member.notes || null,
      status: 'active' as const,
      role: 'fighter' as const,
    }))

    importMembers(membersToImport, {
      onSuccess: () => {
        setStep('done')
      },
      onError: () => {
        setStep('preview')
      },
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Leden Importeren" size="lg">
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Download template */}
          <div
            className="p-4 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl"
            style={{
              position: 'relative',
              '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              '--border-radius-before': '16px',
            } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <FileSpreadsheet className="text-amber-300" size={24} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] font-medium text-neutral-50">Download eerst de template</h4>
                <p className="text-[13px] text-neutral-400 mt-1">
                  Gebruik onze CSV template om je leden correct te formatteren.
                </p>
                <a
                  href="/templates/leden-import-template.csv"
                  download="leden-import-template.csv"
                  className="inline-flex items-center gap-2 mt-3 text-amber-300 hover:text-amber-200 text-[13px] font-medium transition"
                >
                  <Download size={16} strokeWidth={1.5} />
                  Download CSV Template
                </a>
              </div>
            </div>
          </div>

          {/* Upload area */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="p-8 border-2 border-dashed border-white/20 rounded-2xl hover:border-amber-300/50 transition-colors text-center">
              <Upload className="mx-auto text-neutral-500 mb-4" size={40} strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-neutral-50">Sleep je CSV bestand hierheen</p>
              <p className="text-[13px] text-neutral-500 mt-1">of klik om te selecteren</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-[13px] text-neutral-400">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">Verplichte kolommen</p>
            <ul className="list-disc list-inside space-y-1">
              <li>voornaam</li>
              <li>achternaam</li>
              <li>email</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-300" size={20} strokeWidth={1.5} />
                <div>
                  <p className="text-[14px] font-medium text-emerald-300">{parsedData.length} leden</p>
                  <p className="text-[11px] text-emerald-300/70">klaar om te importeren</p>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="flex-1 p-4 bg-rose-500/10 border border-rose-500/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-rose-300" size={20} strokeWidth={1.5} />
                  <div>
                    <p className="text-[14px] font-medium text-rose-300">{errors.length} fouten</p>
                    <p className="text-[11px] text-rose-300/70">worden overgeslagen</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Errors list */}
          {errors.length > 0 && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/40 rounded-2xl max-h-32 overflow-y-auto">
              <p className="text-[11px] uppercase tracking-[0.22em] text-rose-300 mb-2">Fouten</p>
              {errors.map((error, i) => (
                <p key={i} className="text-[13px] text-rose-300/70">
                  Rij {error.row}: {error.field} - {error.message}
                </p>
              ))}
            </div>
          )}

          {/* Preview table */}
          <div
            className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl overflow-hidden"
            style={{
              position: 'relative',
              '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              '--border-radius-before': '16px',
            } as React.CSSProperties}
          >
            <div className="max-h-64 overflow-auto">
              <table className="w-full">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-4 py-3">Naam</th>
                    <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-4 py-3">Email</th>
                    <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-4 py-3">Disciplines</th>
                    <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-4 py-3">Gordel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedData.slice(0, 10).map((member, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-[14px] text-neutral-50">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-4 py-3 text-[14px] text-neutral-400">{member.email}</td>
                      <td className="px-4 py-3 text-[14px] text-neutral-400">
                        {member.disciplines?.join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-[14px] text-neutral-400">
                        {member.belt_color || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 10 && (
              <div className="px-4 py-2 bg-white/5 text-[13px] text-neutral-500 text-center">
                En {parsedData.length - 10} meer...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <button
              onClick={resetState}
              className="text-[14px] text-neutral-400 hover:text-neutral-50 transition-colors"
            >
              Ander bestand kiezen
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition"
                style={{
                  position: 'relative',
                  '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                  '--border-radius-before': '9999px',
                } as React.CSSProperties}
              >
                Annuleren
              </button>
              <button
                onClick={handleImport}
                disabled={parsedData.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition disabled:opacity-50"
              >
                {parsedData.length} leden importeren
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto text-amber-300 animate-spin mb-4" size={48} strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-neutral-50">Leden importeren...</p>
          <p className="text-[13px] text-neutral-500 mt-1">Dit kan even duren</p>
        </div>
      )}

      {step === 'done' && (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="text-emerald-300" size={32} strokeWidth={1.5} />
          </div>
          <p className="text-[20px] font-medium text-neutral-50">Import succesvol!</p>
          <p className="text-[14px] text-neutral-400 mt-1">{parsedData.length} leden zijn toegevoegd</p>
          <button
            onClick={handleClose}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition"
          >
            Sluiten
          </button>
        </div>
      )}
    </Modal>
  )
}
