import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Eye, Code, Type, AlertCircle } from 'lucide-react'
import {
  useEmailTemplate,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from '../../hooks/useEmailTemplates'

interface TemplateEditorProps {
  templateId: string | null
  onClose: () => void
}

const CATEGORIES = [
  { value: 'welcome', label: 'Welkom' },
  { value: 'reminder', label: 'Herinnering' },
  { value: 'promotion', label: 'Promotie' },
  { value: 'newsletter', label: 'Nieuwsbrief' },
  { value: 'transactional', label: 'Transactioneel' },
  { value: 'general', label: 'Algemeen' },
]

const DEFAULT_VARIABLES = [
  { key: 'first_name', description: 'Voornaam van het lid' },
  { key: 'last_name', description: 'Achternaam van het lid' },
  { key: 'email', description: 'Email adres' },
  { key: 'subscription_name', description: 'Naam van het abonnement' },
  { key: 'belt_color', description: 'Gordelkleur' },
  { key: 'discipline', description: 'Discipline (BJJ, MMA, etc.)' },
]

export function TemplateEditor({ templateId, onClose }: TemplateEditorProps) {
  const { data: existingTemplate, isLoading } = useEmailTemplate(templateId || undefined)
  const createTemplate = useCreateEmailTemplate()
  const updateTemplate = useUpdateEmailTemplate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [category, setCategory] = useState('general')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [error, setError] = useState<string | null>(null)

  // Load existing template data - intentional async data sync
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name)
      setDescription(existingTemplate.description || '')
      setSubject(existingTemplate.subject)
      setBodyHtml(existingTemplate.body_html)
      setPreviewText(existingTemplate.preview_text || '')
      setCategory(existingTemplate.category || 'general')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTemplate?.id]) // Only update when template ID changes

  const handleSave = async () => {
    setError(null)

    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      setError('Vul alle verplichte velden in')
      return
    }

    try {
      if (templateId && existingTemplate) {
        await updateTemplate.mutateAsync({
          id: templateId,
          data: {
            name,
            description,
            subject,
            body_html: bodyHtml,
            preview_text: previewText,
            category,
          },
        })
      } else {
        await createTemplate.mutateAsync({
          name,
          description,
          subject,
          body_html: bodyHtml,
          preview_text: previewText,
          category,
        })
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body-editor') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = bodyHtml.slice(0, start) + `{{${variable}}}` + bodyHtml.slice(end)
      setBodyHtml(newValue)

      // Reset cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4
      }, 0)
    } else {
      setBodyHtml(bodyHtml + `{{${variable}}}`)
    }
  }

  const previewHtml = bodyHtml
    .replace(/\{\{first_name\}\}/g, 'John')
    .replace(/\{\{last_name\}\}/g, 'Doe')
    .replace(/\{\{email\}\}/g, 'john@example.com')
    .replace(/\{\{subscription_name\}\}/g, '1 Jaar Unlimited')
    .replace(/\{\{belt_color\}\}/g, 'blauwe')
    .replace(/\{\{discipline\}\}/g, 'BJJ')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-neutral-400">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {templateId ? 'Template Bewerken' : 'Nieuw Template'}
            </h1>
            <p className="text-neutral-400 text-sm">
              Maak een herbruikbaar email template
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={createTemplate.isPending || updateTemplate.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Opslaan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'edit' ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Template Naam *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv: Welkom Nieuw Lid"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Onderwerp *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Bijv: Welkom bij Reconnect Academy, {{first_name}}!"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Email Body (HTML) *
                </label>
                <textarea
                  id="body-editor"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>Je email content hier...</p>"
                  rows={12}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Gebruik HTML tags zoals &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt; voor opmaak
                </p>
              </div>

              {/* Preview text */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Preview Text
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Korte preview die in inbox wordt getoond"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Description & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Beschrijving
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Interne beschrijving"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Categorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Preview mode */
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-800">
                <p className="text-sm text-neutral-400">
                  <span className="text-neutral-500">Onderwerp:</span>{' '}
                  {subject.replace(/\{\{first_name\}\}/g, 'John')}
                </p>
              </div>
              <div
                className="p-6 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Variables */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" />
              Variabelen
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Klik om in te voegen in de body
            </p>
            <div className="space-y-2">
              {DEFAULT_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <code className="text-amber-400 text-sm">{`{{${v.key}}}`}</code>
                  <p className="text-xs text-neutral-500 mt-0.5">{v.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
            <h3 className="font-medium text-amber-400 mb-2">Tips</h3>
            <ul className="text-sm text-neutral-400 space-y-2">
              <li>• Houd onderwerpen kort en krachtig (max 50 tekens)</li>
              <li>• Personaliseer met variabelen voor hogere open rates</li>
              <li>• Test altijd eerst met een test verzending</li>
              <li>• Header en footer worden automatisch toegevoegd</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
