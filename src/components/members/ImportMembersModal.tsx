import { useState, useCallback } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Users, AlertTriangle, ArrowRight, SkipForward } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Modal } from '../ui'
import { useImportMembers } from '../../hooks/useImportMembers'
import { useCheckImportDuplicates, getMatchTypeLabel, getConfidenceColor } from '../../hooks/useDuplicateDetection'

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
  legacy_checkin_count?: number
  notes?: string
  // ClubPlanner extra velden (voor display, niet opgeslagen)
  member_since?: string
  last_visit?: string
  retention_status?: string
  subscription_status?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportDuplicate {
  input_index: number
  existing_member_id: string
  match_type: string
  confidence: number
  existing_first_name: string
  existing_last_name: string
  existing_email: string
  // Parsed member data
  parsed_member: ParsedMember
  // User decision: 'skip' | 'add_new' | 'update'
  action: 'skip' | 'add_new' | 'update'
}

export function ImportMembersModal({ isOpen, onClose }: ImportMembersModalProps) {
  const [_file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedMember[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [duplicates, setDuplicates] = useState<ImportDuplicate[]>([])
  const [step, setStep] = useState<'upload' | 'checking' | 'duplicates' | 'preview' | 'importing' | 'done'>('upload')

  const { mutate: importMembers } = useImportMembers()
  const { mutateAsync: checkDuplicates } = useCheckImportDuplicates()

  const resetState = () => {
    setFile(null)
    setParsedData([])
    setErrors([])
    setDuplicates([])
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
    // Supports both custom format and ClubPlanner export format
    const headerMap: Record<string, string> = {
      // Custom format (Nederlands)
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
      'trainingen': 'legacy_checkin_count',
      'training_count': 'legacy_checkin_count',
      'legacy_checkin_count': 'legacy_checkin_count',
      'notities': 'notes',

      // ClubPlanner export format
      'naam': 'last_name',
      'e-mail': 'email',
      'mobiel nr.': 'phone',
      'telefoonnr.': 'phone',
      'adres': 'street',
      'stad': 'city',
      'aantal bezoeken': 'legacy_checkin_count',
      'memo': 'notes',
      'lid sinds': 'member_since',
      'laatste bezoek': 'last_visit',
      'retentiestatus': 'retention_status',
      'status': 'subscription_status',
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
          if (field === 'legacy_checkin_count' && typeof value === 'string') {
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
          legacy_checkin_count: row.legacy_checkin_count as number | undefined,
          notes: row.notes as string | undefined,
        })
      }
    }

    return { data, errors }
  }, [])

  // Parse Excel file to CSV-like text
  const parseExcelToRows = useCallback((buffer: ArrayBuffer): string[][] => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to array of arrays (including header row)
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })
    return rows as string[][]
  }, [])

  // Process rows (from CSV or Excel) into ParsedMember objects
  const processRows = useCallback((rows: string[][]): { data: ParsedMember[]; errors: ValidationError[] } => {
    if (rows.length < 2) {
      return { data: [], errors: [{ row: 0, field: 'file', message: 'Bestand is leeg of heeft geen data rijen' }] }
    }

    const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase())
    const data: ParsedMember[] = []
    const errors: ValidationError[] = []

    // Map CSV headers to our fields
    // Supports both custom format and ClubPlanner export format
    const headerMap: Record<string, string> = {
      // Custom format (Nederlands)
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
      'trainingen': 'legacy_checkin_count',
      'training_count': 'legacy_checkin_count',
      'legacy_checkin_count': 'legacy_checkin_count',
      'notities': 'notes',

      // ClubPlanner export format
      'naam': 'last_name',
      'e-mail': 'email',
      'mobiel nr.': 'phone',
      'telefoonnr.': 'phone',
      'adres': 'street',
      'stad': 'city',
      'aantal bezoeken': 'legacy_checkin_count',
      'memo': 'notes',
      'lid sinds': 'member_since',
      'laatste bezoek': 'last_visit',
      'retentiestatus': 'retention_status',
      'status': 'subscription_status',
    }

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i]
      if (!values || values.length === 0 || values.every(v => !v)) continue

      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const field = headerMap[header]
        if (field && values[index] !== undefined && values[index] !== null && values[index] !== '') {
          let value: unknown = values[index]?.toString().trim()

          // Parse specific fields
          if (field === 'disciplines' && typeof value === 'string') {
            value = value.split(',').map(d => d.trim().toLowerCase())
          }
          if (field === 'belt_stripes' && typeof value === 'string') {
            value = parseInt(value, 10) || 0
          }
          if ((field === 'legacy_checkin_count' || field === 'aantal bezoeken') && typeof value === 'string') {
            value = parseInt(value, 10) || 0
          }
          if (field === 'gender' && typeof value === 'string') {
            // Map ClubPlanner gender values
            const genderMap: Record<string, string> = {
              'man': 'man',
              'vrouw': 'vrouw',
              'onbekend': 'onbekend',
              'm': 'man',
              'v': 'vrouw',
              'male': 'man',
              'female': 'vrouw',
            }
            value = genderMap[value.toLowerCase()] || value.toLowerCase()
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
        errors.push({ row: i + 1, field: 'achternaam/naam', message: 'Achternaam is verplicht' })
      }
      if (!row.email) {
        errors.push({ row: i + 1, field: 'email/e-mail', message: 'Email is verplicht' })
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
          legacy_checkin_count: row.legacy_checkin_count as number | undefined,
          notes: row.notes as string | undefined,
          member_since: row.member_since as string | undefined,
          last_visit: row.last_visit as string | undefined,
          retention_status: row.retention_status as string | undefined,
          subscription_status: row.subscription_status as string | undefined,
        })
      }
    }

    return { data, errors }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setStep('checking')

    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')

    const reader = new FileReader()
    reader.onload = async (event) => {
      let data: ParsedMember[] = []
      let errors: ValidationError[] = []

      try {
        if (isExcel) {
          // Parse Excel file
          const buffer = event.target?.result as ArrayBuffer
          const rows = parseExcelToRows(buffer)
          const result = processRows(rows)
          data = result.data
          errors = result.errors
        } else {
          // Parse CSV file
          const text = event.target?.result as string
          const result = parseCSV(text)
          data = result.data
          errors = result.errors
        }
      } catch (err) {
        console.error('Error parsing file:', err)
        errors = [{ row: 0, field: 'file', message: 'Fout bij het lezen van het bestand' }]
      }

      setParsedData(data)
      setErrors(errors)

      // Check for duplicates against existing members
      if (data.length > 0) {
        try {
          const emails = data.map(m => m.email).filter(Boolean)
          const phones = data.map(m => m.phone).filter((p): p is string => !!p)

          const duplicateResults = await checkDuplicates({ emails, phones })

          if (duplicateResults && duplicateResults.length > 0) {
            // Map duplicates to our interface with parsed member data
            const mappedDuplicates: ImportDuplicate[] = duplicateResults.map(dup => ({
              ...dup,
              parsed_member: data[dup.input_index],
              action: 'skip' as const, // Default action is skip
            }))
            setDuplicates(mappedDuplicates)
            setStep('duplicates')
          } else {
            setDuplicates([])
            setStep('preview')
          }
        } catch (err) {
          console.error('Error checking duplicates:', err)
          // Continue to preview even if duplicate check fails
          setDuplicates([])
          setStep('preview')
        }
      } else {
        setStep('preview')
      }
    }

    // Read as ArrayBuffer for Excel, text for CSV
    if (isExcel) {
      reader.readAsArrayBuffer(selectedFile)
    } else {
      reader.readAsText(selectedFile)
    }
  }

  // Update duplicate action
  const updateDuplicateAction = (index: number, action: 'skip' | 'add_new' | 'update') => {
    setDuplicates(prev => prev.map((dup, i) =>
      i === index ? { ...dup, action } : dup
    ))
  }

  // Set all duplicates to same action
  const setAllDuplicateActions = (action: 'skip' | 'add_new') => {
    setDuplicates(prev => prev.map(dup => ({ ...dup, action })))
  }

  // Proceed from duplicates step to preview
  const handleDuplicatesReviewed = () => {
    setStep('preview')
  }

  // Get members to import (excluding skipped duplicates)
  const getMembersToImport = () => {
    // Get indices of members marked to skip
    const skipIndices = new Set(
      duplicates
        .filter(d => d.action === 'skip')
        .map(d => d.input_index)
    )

    // Filter out skipped members
    return parsedData.filter((_, index) => !skipIndices.has(index))
  }

  const handleImport = () => {
    const membersToImport = getMembersToImport()
    if (membersToImport.length === 0) {
      // All members were skipped
      setStep('done')
      return
    }

    setStep('importing')

    const formattedMembers = membersToImport.map(member => ({
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
      legacy_checkin_count: member.legacy_checkin_count || 0,
      notes: member.notes || null,
      status: 'active' as const,
      role: 'fighter' as const,
    }))

    importMembers(formattedMembers, {
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
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="p-8 border-2 border-dashed border-white/20 rounded-2xl hover:border-amber-300/50 transition-colors text-center">
              <Upload className="mx-auto text-neutral-500 mb-4" size={40} strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-neutral-50">Sleep je CSV of Excel bestand hierheen</p>
              <p className="text-[13px] text-neutral-500 mt-1">of klik om te selecteren (.csv, .xlsx)</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-[13px] text-neutral-400">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">Ondersteunde formaten</p>
            <p className="mb-3 text-neutral-300">ClubPlanner Excel export of CSV met de volgende kolommen:</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">Verplichte kolommen</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Voornaam</li>
              <li>Naam (achternaam)</li>
              <li>E-Mail</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'checking' && (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto text-amber-300 animate-spin mb-4" size={48} strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-neutral-50">Bestand controleren...</p>
          <p className="text-[13px] text-neutral-500 mt-1">Even geduld, we checken op mogelijke duplicaten</p>
        </div>
      )}

      {step === 'duplicates' && (
        <div className="space-y-6">
          {/* Warning header */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/40 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-orange-300 flex-shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
              <div>
                <p className="text-[14px] font-medium text-orange-300">
                  {duplicates.length} mogelijke duplica{duplicates.length === 1 ? 'at' : 'ten'} gevonden
                </p>
                <p className="text-[13px] text-orange-300/70 mt-1">
                  Deze leden lijken al in je database te staan. Kies per lid wat je wilt doen.
                </p>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setAllDuplicateActions('skip')}
              className="flex-1 p-3 text-[13px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition flex items-center justify-center gap-2 text-neutral-300"
            >
              <SkipForward size={16} />
              Alles overslaan
            </button>
            <button
              onClick={() => setAllDuplicateActions('add_new')}
              className="flex-1 p-3 text-[13px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition flex items-center justify-center gap-2 text-neutral-300"
            >
              <Users size={16} />
              Alles toch toevoegen
            </button>
          </div>

          {/* Duplicates list */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {duplicates.map((dup, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border transition ${
                  dup.action === 'skip'
                    ? 'bg-neutral-800/50 border-white/5'
                    : 'bg-white/5 border-orange-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Duplicate info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getConfidenceColor(dup.confidence)} bg-current/10`}>
                        {dup.confidence}% match
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {getMatchTypeLabel(dup.match_type)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* CSV data */}
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-1">CSV import</p>
                        <p className="text-[14px] font-medium text-neutral-50">
                          {dup.parsed_member.first_name} {dup.parsed_member.last_name}
                        </p>
                        <p className="text-[13px] text-neutral-400">{dup.parsed_member.email}</p>
                      </div>

                      {/* Existing data */}
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-1">Bestaand lid</p>
                        <p className="text-[14px] font-medium text-neutral-50">
                          {dup.existing_first_name} {dup.existing_last_name}
                        </p>
                        <p className="text-[13px] text-neutral-400">{dup.existing_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => updateDuplicateAction(index, 'skip')}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition ${
                        dup.action === 'skip'
                          ? 'bg-neutral-600 text-white'
                          : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                      }`}
                    >
                      Overslaan
                    </button>
                    <button
                      onClick={() => updateDuplicateAction(index, 'add_new')}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition ${
                        dup.action === 'add_new'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                      }`}
                    >
                      Toch toevoegen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-white/5 rounded-2xl">
            <div className="flex justify-between text-[13px]">
              <span className="text-neutral-400">Totaal in CSV:</span>
              <span className="text-neutral-50 font-medium">{parsedData.length} leden</span>
            </div>
            <div className="flex justify-between text-[13px] mt-1">
              <span className="text-neutral-400">Duplicaten overslaan:</span>
              <span className="text-orange-300 font-medium">{duplicates.filter(d => d.action === 'skip').length}</span>
            </div>
            <div className="flex justify-between text-[13px] mt-1">
              <span className="text-neutral-400">Toch toevoegen:</span>
              <span className="text-emerald-300 font-medium">{duplicates.filter(d => d.action === 'add_new').length}</span>
            </div>
            <div className="flex justify-between text-[13px] mt-2 pt-2 border-t border-white/10">
              <span className="text-neutral-50 font-medium">Te importeren:</span>
              <span className="text-amber-300 font-medium">{getMembersToImport().length} leden</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <button
              onClick={resetState}
              className="text-[14px] text-neutral-400 hover:text-neutral-50 transition-colors"
            >
              Ander bestand kiezen
            </button>
            <button
              onClick={handleDuplicatesReviewed}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition"
            >
              Doorgaan
              <ArrowRight size={18} />
            </button>
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
                  <p className="text-[14px] font-medium text-emerald-300">{getMembersToImport().length} leden</p>
                  <p className="text-[11px] text-emerald-300/70">klaar om te importeren</p>
                </div>
              </div>
            </div>

            {duplicates.filter(d => d.action === 'skip').length > 0 && (
              <div className="flex-1 p-4 bg-orange-500/10 border border-orange-500/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <SkipForward className="text-orange-300" size={20} strokeWidth={1.5} />
                  <div>
                    <p className="text-[14px] font-medium text-orange-300">{duplicates.filter(d => d.action === 'skip').length} duplicaten</p>
                    <p className="text-[11px] text-orange-300/70">worden overgeslagen</p>
                  </div>
                </div>
              </div>
            )}

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
                    <th className="text-right text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-4 py-3">Trainingen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getMembersToImport().slice(0, 10).map((member, i) => (
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
                      <td className="px-4 py-3 text-[14px] text-neutral-400 text-right">
                        {member.legacy_checkin_count || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {getMembersToImport().length > 10 && (
              <div className="px-4 py-2 bg-white/5 text-[13px] text-neutral-500 text-center">
                En {getMembersToImport().length - 10} meer...
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
                disabled={getMembersToImport().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition disabled:opacity-50"
              >
                {getMembersToImport().length} leden importeren
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
          <p className="text-[14px] text-neutral-400 mt-1">{getMembersToImport().length} leden zijn toegevoegd</p>
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
