import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  FileText,
  Edit,
  Send,
  AlertCircle,
  Filter,
  Search,
  UserPlus,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useEmailTemplates } from '../../hooks/useEmailTemplates'
import {
  useCreateEmailCampaign,
  useCampaignAudienceCount,
  useSearchMembersForEmail,
  type AudienceFilter,
  type MemberSearchResult,
} from '../../hooks/useEmailCampaigns'
import { useDisciplines } from '../../hooks/useDisciplines'

type AudienceMode = 'filter' | 'custom'

interface CampaignWizardProps {
  onClose: () => void
  onSuccess: (campaignId: string) => void
}

const STEPS = [
  { id: 1, name: 'Audience', icon: Users },
  { id: 2, name: 'Template', icon: FileText },
  { id: 3, name: 'Content', icon: Edit },
  { id: 4, name: 'Verstuur', icon: Send },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actieve leden' },
  { value: 'frozen', label: 'Gepauzeerde leden' },
  { value: 'cancelled', label: 'Geannuleerde leden' },
]

const ROLE_OPTIONS = [
  { value: 'fighter', label: 'Fighters' },
  { value: 'fan', label: 'Fans' },
  { value: 'coach', label: 'Coaches' },
]

export function CampaignWizard({ onClose, onSuccess }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [useCustomContent, setUseCustomContent] = useState(false)

  // Audience mode and filter
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('filter')
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>({
    status: [],
    role: [],
    disciplines: [],
  })
  const [audienceError, setAudienceError] = useState<string | null>(null)

  // Custom selection state
  const [customRecipients, setCustomRecipients] = useState<MemberSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  const { data: templates } = useEmailTemplates()
  const { data: disciplines } = useDisciplines()
  const createCampaign = useCreateEmailCampaign()
  const getAudienceCount = useCampaignAudienceCount()
  const searchMembers = useSearchMembersForEmail()

  const [audienceCount, setAudienceCount] = useState<number | null>(null)

  // Fetch audience count when filter or custom recipients change
  useEffect(() => {
    setAudienceError(null)

    if (audienceMode === 'custom') {
      // For custom mode, just count the selected recipients (excluding unsubscribed)
      const validRecipients = customRecipients.filter((r) => !r.is_unsubscribed)
      setAudienceCount(validRecipients.length)
    } else {
      // For filter mode, call the RPC
      getAudienceCount.mutate(
        { filter: audienceFilter },
        {
          onSuccess: (count) => {
            setAudienceCount(count)
          },
          onError: (err) => {
            console.error('Audience count error:', err)
            setAudienceError((err as Error).message)
          },
        }
      )
    }
  }, [audienceFilter, audienceMode, customRecipients])

  // Reset all filters
  const resetFilters = () => {
    setAudienceFilter({
      status: [],
      role: [],
      disciplines: [],
    })
  }

  // Select all members with email (no filters)
  const selectAllMembers = () => {
    setAudienceFilter({
      status: [],
      role: [],
      disciplines: [],
    })
  }

  // Custom selection handlers
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMembers.mutate(searchQuery)
    }
  }

  const addRecipient = (member: MemberSearchResult) => {
    if (!customRecipients.find((r) => r.member_id === member.member_id)) {
      setCustomRecipients([...customRecipients, member])
    }
  }

  const removeRecipient = (memberId: string) => {
    setCustomRecipients(customRecipients.filter((r) => r.member_id !== memberId))
  }

  const clearCustomRecipients = () => {
    setCustomRecipients([])
  }

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId)

  const handleNext = () => {
    setError(null)

    if (currentStep === 1) {
      if (audienceCount === 0) {
        setError('Geen ontvangers gevonden met deze filters')
        return
      }
    }

    if (currentStep === 2) {
      if (!selectedTemplateId && !useCustomContent) {
        setError('Selecteer een template of kies voor custom content')
        return
      }
    }

    if (currentStep === 3) {
      if (!name.trim()) {
        setError('Geef de campagne een naam')
        return
      }
      if (useCustomContent && (!customSubject.trim() || !customBody.trim())) {
        setError('Vul onderwerp en body in')
        return
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreate = async () => {
    setError(null)

    try {
      const campaignData: {
        name: string
        template_id?: string
        subject?: string
        body_html?: string
        audience_filter?: AudienceFilter
        custom_recipients?: string[]
      } = {
        name,
        template_id: useCustomContent ? undefined : selectedTemplateId || undefined,
        subject: useCustomContent ? customSubject : undefined,
        body_html: useCustomContent ? customBody : undefined,
      }

      if (audienceMode === 'custom') {
        // Use custom recipient IDs
        campaignData.custom_recipients = customRecipients
          .filter((r) => !r.is_unsubscribed)
          .map((r) => r.member_id)
      } else {
        // Use filter
        campaignData.audience_filter = audienceFilter
      }

      const campaign = await createCampaign.mutateAsync(campaignData)
      onSuccess(campaign.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const toggleFilter = (
    type: 'status' | 'role' | 'disciplines',
    value: string
  ) => {
    setAudienceFilter((prev) => {
      const current = prev[type] || []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [type]: updated }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Nieuwe Campagne</h1>
          <p className="text-neutral-400 text-sm">
            Stap {currentStep} van 4
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg flex-1 ${
                currentStep === step.id
                  ? 'bg-amber-400/10 border border-amber-400/30'
                  : currentStep > step.id
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-amber-400 text-neutral-900'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="w-8 h-0.5 bg-neutral-700" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        {currentStep === 1 && (
          <AudienceStep
            mode={audienceMode}
            onModeChange={setAudienceMode}
            filter={audienceFilter}
            audienceCount={audienceCount}
            isLoading={getAudienceCount.isPending}
            onToggle={toggleFilter}
            onReset={resetFilters}
            onSelectAll={selectAllMembers}
            statusOptions={STATUS_OPTIONS}
            roleOptions={ROLE_OPTIONS}
            disciplines={disciplines || []}
            error={audienceError}
            // Custom selection props
            customRecipients={customRecipients}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            searchResults={searchMembers.data || []}
            isSearching={searchMembers.isPending}
            onAddRecipient={addRecipient}
            onRemoveRecipient={removeRecipient}
            onClearRecipients={clearCustomRecipients}
          />
        )}

        {currentStep === 2 && (
          <TemplateStep
            templates={templates || []}
            selectedTemplateId={selectedTemplateId}
            useCustomContent={useCustomContent}
            onSelectTemplate={setSelectedTemplateId}
            onToggleCustom={() => {
              setUseCustomContent(!useCustomContent)
              if (!useCustomContent) {
                setSelectedTemplateId(null)
              }
            }}
          />
        )}

        {currentStep === 3 && (
          <ContentStep
            name={name}
            onNameChange={setName}
            useCustomContent={useCustomContent}
            selectedTemplate={selectedTemplate}
            customSubject={customSubject}
            customBody={customBody}
            onSubjectChange={setCustomSubject}
            onBodyChange={setCustomBody}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            name={name}
            audienceCount={audienceCount || 0}
            audienceMode={audienceMode}
            audienceFilter={audienceFilter}
            customRecipientsCount={customRecipients.length}
            templateName={selectedTemplate?.name}
            useCustomContent={useCustomContent}
            subject={useCustomContent ? customSubject : selectedTemplate?.subject || ''}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vorige</span>
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
          >
            <span>Volgende</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={createCampaign.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Campagne Aanmaken</span>
          </button>
        )}
      </div>
    </div>
  )
}

function AudienceStep({
  mode,
  onModeChange,
  filter,
  audienceCount,
  isLoading,
  onToggle,
  onReset,
  onSelectAll,
  statusOptions,
  roleOptions,
  disciplines,
  error,
  // Custom selection props
  customRecipients,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  isSearching,
  onAddRecipient,
  onRemoveRecipient,
  onClearRecipients,
}: {
  mode: AudienceMode
  onModeChange: (mode: AudienceMode) => void
  filter: AudienceFilter
  audienceCount: number | null
  isLoading: boolean
  onToggle: (type: 'status' | 'role' | 'disciplines', value: string) => void
  onReset: () => void
  onSelectAll: () => void
  statusOptions: { value: string; label: string }[]
  roleOptions: { value: string; label: string }[]
  disciplines: { id: string; name: string }[]
  error?: string | null
  // Custom selection props
  customRecipients: MemberSearchResult[]
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: () => void
  searchResults: MemberSearchResult[]
  isSearching: boolean
  onAddRecipient: (member: MemberSearchResult) => void
  onRemoveRecipient: (memberId: string) => void
  onClearRecipients: () => void
}) {
  const hasFilters = (filter.status?.length || 0) > 0 ||
    (filter.role?.length || 0) > 0 ||
    (filter.disciplines?.length || 0) > 0

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Selecteer je audience</h2>
          <p className="text-neutral-400 text-sm mt-1">
            {mode === 'filter' ? 'Filter op status, rol en discipline' : 'Zoek en selecteer specifieke leden'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl">
          <Users className="w-5 h-5 text-amber-400" />
          <span className="text-lg font-bold text-amber-400">
            {isLoading ? '...' : audienceCount?.toLocaleString() || 0}
          </span>
          <span className="text-amber-400/70">ontvangers</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 p-1 bg-neutral-800 rounded-lg">
        <button
          onClick={() => onModeChange('filter')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'filter'
              ? 'bg-amber-400 text-neutral-900'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button
          onClick={() => onModeChange('custom')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-amber-400 text-neutral-900'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Custom Selectie
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Filter Mode */}
      {mode === 'filter' && (
        <>
          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
            >
              Alle leden met email
            </button>
            {hasFilters && (
              <button
                onClick={onReset}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors text-sm"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Warning when 0 results with filters */}
          {audienceCount === 0 && !isLoading && hasFilters && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
              <strong>Geen ontvangers gevonden.</strong> Probeer minder filters te selecteren of klik op "Alle leden met email".
            </div>
          )}

          {/* Status filter */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Lidmaatschap Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  selected={filter.status?.includes(opt.value) || false}
                  onClick={() => onToggle('status', opt.value)}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Geen status geselecteerd = alle statussen
            </p>
          </div>

          {/* Role filter */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Rol</h3>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  selected={filter.role?.includes(opt.value) || false}
                  onClick={() => onToggle('role', opt.value)}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Geen rol geselecteerd = alle rollen
            </p>
          </div>

          {/* Disciplines filter */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Disciplines</h3>
            <div className="flex flex-wrap gap-2">
              {disciplines.map((d) => (
                <FilterChip
                  key={d.id}
                  label={d.name}
                  selected={filter.disciplines?.includes(d.name.toLowerCase()) || false}
                  onClick={() => onToggle('disciplines', d.name.toLowerCase())}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Geen discipline geselecteerd = alle disciplines
            </p>
          </div>

          {/* Info about disciplines */}
          {(filter.disciplines?.length || 0) > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
              <strong>Let op:</strong> De meeste leden hebben nog geen disciplines ingesteld in hun profiel.
              Dit filter werkt alleen op leden die expliciet disciplines hebben toegewezen.
            </div>
          )}
        </>
      )}

      {/* Custom Selection Mode */}
      {mode === 'custom' && (
        <>
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                placeholder="Zoek op naam of email..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <button
              onClick={onSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-amber-400 text-neutral-900 font-medium rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Zoeken...' : 'Zoeken'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-neutral-700 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-neutral-800 text-sm text-neutral-400">
                {searchResults.length} resultaten gevonden
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-neutral-800">
                {searchResults.map((member) => {
                  const isSelected = customRecipients.some(
                    (r) => r.member_id === member.member_id
                  )
                  return (
                    <div
                      key={member.member_id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-800/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {member.first_name} {member.last_name}
                          </span>
                          {member.is_unsubscribed && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Uitgeschreven
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-neutral-400 truncate block">
                          {member.email}
                        </span>
                      </div>
                      <button
                        onClick={() => onAddRecipient(member)}
                        disabled={isSelected || member.is_unsubscribed}
                        className={`ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : member.is_unsubscribed
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                            : 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                        }`}
                      >
                        {isSelected ? 'Toegevoegd' : 'Toevoegen'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-300">
                Geselecteerde ontvangers ({customRecipients.length})
              </h3>
              {customRecipients.length > 0 && (
                <button
                  onClick={onClearRecipients}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Alles verwijderen
                </button>
              )}
            </div>

            {customRecipients.length === 0 ? (
              <div className="p-6 border border-dashed border-neutral-700 rounded-lg text-center">
                <UserPlus className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">
                  Zoek hierboven naar leden om toe te voegen
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-neutral-800/50 rounded-lg">
                {customRecipients.map((member) => (
                  <div
                    key={member.member_id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      member.is_unsubscribed
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-neutral-700'
                    }`}
                  >
                    <span className={member.is_unsubscribed ? 'text-red-300' : 'text-white'}>
                      {member.first_name} {member.last_name}
                    </span>
                    {member.is_unsubscribed && (
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    )}
                    <button
                      onClick={() => onRemoveRecipient(member.member_id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Warning about unsubscribed */}
            {customRecipients.some((r) => r.is_unsubscribed) && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Sommige geselecteerde leden hebben zich uitgeschreven en zullen geen email ontvangen.
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        selected
          ? 'bg-amber-400 text-neutral-900'
          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      {label}
    </button>
  )
}

function TemplateStep({
  templates,
  selectedTemplateId,
  useCustomContent,
  onSelectTemplate,
  onToggleCustom,
}: {
  templates: any[]
  selectedTemplateId: string | null
  useCustomContent: boolean
  onSelectTemplate: (id: string) => void
  onToggleCustom: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Kies een template</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Selecteer een bestaand template of schrijf custom content
        </p>
      </div>

      {/* Custom content option */}
      <button
        onClick={onToggleCustom}
        className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
          useCustomContent
            ? 'border-amber-400 bg-amber-400/5'
            : 'border-neutral-700 hover:border-neutral-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              useCustomContent ? 'bg-amber-400/20' : 'bg-neutral-800'
            }`}
          >
            <Edit className={`w-5 h-5 ${useCustomContent ? 'text-amber-400' : 'text-neutral-400'}`} />
          </div>
          <div>
            <h3 className="font-medium text-white">Custom Content</h3>
            <p className="text-sm text-neutral-400">
              Schrijf je eigen onderwerp en body
            </p>
          </div>
        </div>
      </button>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => {
              onSelectTemplate(template.id)
              if (useCustomContent) onToggleCustom()
            }}
            disabled={useCustomContent}
            className={`p-4 rounded-xl border-2 transition-colors text-left ${
              selectedTemplateId === template.id && !useCustomContent
                ? 'border-amber-400 bg-amber-400/5'
                : 'border-neutral-700 hover:border-neutral-600'
            } ${useCustomContent ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-neutral-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-white truncate">{template.name}</h3>
                <p className="text-sm text-neutral-400 truncate">{template.subject}</p>
                <span className="text-xs text-neutral-500 px-2 py-0.5 bg-neutral-800 rounded mt-2 inline-block">
                  {template.category}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ContentStep({
  name,
  onNameChange,
  useCustomContent,
  selectedTemplate,
  customSubject,
  customBody,
  onSubjectChange,
  onBodyChange,
}: {
  name: string
  onNameChange: (name: string) => void
  useCustomContent: boolean
  selectedTemplate: any
  customSubject: string
  customBody: string
  onSubjectChange: (s: string) => void
  onBodyChange: (b: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Campagne Details</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Geef je campagne een naam en pas de content aan
        </p>
      </div>

      {/* Campaign name */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">
          Campagne Naam *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Bijv: Januari Nieuwsbrief 2026"
          className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      {useCustomContent ? (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Onderwerp *
            </label>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Email onderwerp"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Body (HTML) *
            </label>
            <textarea
              value={customBody}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="<p>Je email content hier...</p>"
              rows={8}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </>
      ) : selectedTemplate ? (
        <div className="bg-neutral-800 rounded-xl p-4">
          <h3 className="font-medium text-white mb-2">Template Preview</h3>
          <p className="text-sm text-neutral-400 mb-3">
            <strong>Onderwerp:</strong> {selectedTemplate.subject}
          </p>
          <div
            className="text-sm text-neutral-300 prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html }}
          />
        </div>
      ) : (
        <div className="text-neutral-500 text-center py-8">
          Geen template geselecteerd
        </div>
      )}
    </div>
  )
}

function ReviewStep({
  name,
  audienceCount,
  audienceMode,
  audienceFilter,
  customRecipientsCount,
  templateName,
  useCustomContent,
  subject,
}: {
  name: string
  audienceCount: number
  audienceMode: AudienceMode
  audienceFilter: AudienceFilter
  customRecipientsCount: number
  templateName?: string
  useCustomContent: boolean
  subject: string
}) {
  const getAudienceDescription = () => {
    if (audienceMode === 'custom') {
      return `Custom selectie (${customRecipientsCount} leden)`
    }
    const filters = []
    if (audienceFilter.status?.length) {
      filters.push(`Status: ${audienceFilter.status.join(', ')}`)
    }
    if (audienceFilter.role?.length) {
      filters.push(`Rol: ${audienceFilter.role.join(', ')}`)
    }
    if (audienceFilter.disciplines?.length) {
      filters.push(`Disciplines: ${audienceFilter.disciplines.join(', ')}`)
    }
    return filters.length > 0 ? filters.join(' | ') : 'Alle leden met email'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Review & Bevestig</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Controleer je campagne voor het aanmaken
        </p>
      </div>

      <div className="space-y-4">
        <ReviewItem label="Campagne Naam" value={name} />
        <ReviewItem
          label="Ontvangers"
          value={`${audienceCount.toLocaleString()} leden`}
        />
        <ReviewItem
          label="Selectie Type"
          value={audienceMode === 'custom' ? 'Custom selectie' : 'Filter'}
        />
        <ReviewItem label="Criteria" value={getAudienceDescription()} />
        <ReviewItem
          label="Template"
          value={useCustomContent ? 'Custom content' : templateName || '-'}
        />
        <ReviewItem label="Onderwerp" value={subject} />
      </div>

      <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-xl">
        <p className="text-amber-300 text-sm">
          <strong>Let op:</strong> Na het aanmaken kun je de campagne nog bewerken
          voordat je deze verstuurt. Je kunt ook eerst een test email versturen.
        </p>
      </div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-800">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
