import { useState } from 'react'
import {
  Mail,
  FileText,
  Send,
  BarChart3,
  AlertCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
} from 'lucide-react'
import { useModules } from '../hooks/useModules'
import { useEmailTemplates, useDeleteEmailTemplate } from '../hooks/useEmailTemplates'
import {
  useEmailCampaigns,
  useDeleteEmailCampaign,
  useSendCampaign,
  type EmailCampaignWithTemplate,
} from '../hooks/useEmailCampaigns'
import { TemplateEditor } from '../components/email/TemplateEditor'
import { CampaignWizard } from '../components/email/CampaignWizard'
import { CampaignDetail } from '../components/email/CampaignDetail'

type TabType = 'campaigns' | 'templates' | 'analytics'

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-neutral-400">{label}</p>
          {subtext && (
            <p className="text-xs text-neutral-500 mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-neutral-500/20 text-neutral-300', label: 'Concept' },
    scheduled: { color: 'bg-blue-500/20 text-blue-300', label: 'Gepland' },
    sending: { color: 'bg-amber-500/20 text-amber-300', label: 'Bezig...' },
    sent: { color: 'bg-green-500/20 text-green-300', label: 'Verzonden' },
    cancelled: { color: 'bg-red-500/20 text-red-300', label: 'Geannuleerd' },
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function Email() {
  const { hasAccess, getTrialInfo } = useModules()
  const [activeTab, setActiveTab] = useState<TabType>('campaigns')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [showCampaignWizard, setShowCampaignWizard] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  const trialInfo = getTrialInfo('email')

  // Data fetching
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates()
  const { data: campaigns, isLoading: campaignsLoading } = useEmailCampaigns()
  const deleteTemplate = useDeleteEmailTemplate()
  const deleteCampaign = useDeleteEmailCampaign()
  const sendCampaign = useSendCampaign()

  // Stats
  const totalCampaigns = campaigns?.length || 0
  const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0
  const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.total_delivered || 0), 0) || 0
  const totalOpened = campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0
  const avgOpenRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0

  // Check access
  if (!hasAccess('email')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Email Marketing Module</h2>
          <p className="text-neutral-400 mb-6">
            Verstuur professionele email campagnes naar je leden. Templates, bulk verzending en tracking inbegrepen.
          </p>
          <button className="px-6 py-3 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors">
            Start 30-dagen trial
          </button>
        </div>
      </div>
    )
  }

  // Show campaign detail view
  if (selectedCampaignId) {
    return (
      <CampaignDetail
        campaignId={selectedCampaignId}
        onBack={() => setSelectedCampaignId(null)}
      />
    )
  }

  // Show template editor
  if (showTemplateEditor || editingTemplateId) {
    return (
      <TemplateEditor
        templateId={editingTemplateId}
        onClose={() => {
          setShowTemplateEditor(false)
          setEditingTemplateId(null)
        }}
      />
    )
  }

  // Show campaign wizard
  if (showCampaignWizard) {
    return (
      <CampaignWizard
        onClose={() => setShowCampaignWizard(false)}
        onSuccess={(campaignId) => {
          setShowCampaignWizard(false)
          setSelectedCampaignId(campaignId)
        }}
      />
    )
  }

  const filteredTemplates = templates?.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCampaigns = campaigns?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Marketing</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Campagnes, templates en analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {trialInfo.isTrialing && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{trialInfo.daysLeft} dagen trial over</span>
            </div>
          )}
          <button
            onClick={() => setShowCampaignWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe Campagne</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Send}
          label="Verzonden"
          value={sentCampaigns.toString()}
          subtext={`${totalCampaigns} totaal`}
        />
        <StatCard
          icon={Users}
          label="Afgeleverd"
          value={totalDelivered.toLocaleString()}
        />
        <StatCard
          icon={Eye}
          label="Geopend"
          value={totalOpened.toLocaleString()}
          subtext={`${avgOpenRate}% open rate`}
        />
        <StatCard
          icon={FileText}
          label="Templates"
          value={(templates?.length || 0).toString()}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <TabButton
          active={activeTab === 'campaigns'}
          onClick={() => setActiveTab('campaigns')}
          icon={Send}
          label="Campagnes"
        />
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={FileText}
          label="Templates"
        />
        <TabButton
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
          icon={BarChart3}
          label="Analytics"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder={activeTab === 'templates' ? 'Zoek templates...' : 'Zoek campagnes...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      {/* Content */}
      {activeTab === 'campaigns' && (
        <CampaignsList
          campaigns={filteredCampaigns || []}
          isLoading={campaignsLoading}
          onView={(id) => setSelectedCampaignId(id)}
          onDelete={(id) => {
            if (confirm('Weet je zeker dat je deze campagne wilt verwijderen?')) {
              deleteCampaign.mutate(id)
            }
          }}
          onSend={(id) => {
            if (confirm('Weet je zeker dat je deze campagne wilt verzenden?')) {
              sendCampaign.mutate({ campaignId: id })
            }
          }}
        />
      )}

      {activeTab === 'templates' && (
        <TemplatesList
          templates={filteredTemplates || []}
          isLoading={templatesLoading}
          onEdit={(id) => setEditingTemplateId(id)}
          onDelete={(id) => {
            if (confirm('Weet je zeker dat je dit template wilt verwijderen?')) {
              deleteTemplate.mutate(id)
            }
          }}
          onCreate={() => setShowTemplateEditor(true)}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard campaigns={campaigns || []} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        active
          ? 'border-amber-400 text-amber-400'
          : 'border-transparent text-neutral-400 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

function CampaignsList({
  campaigns,
  isLoading,
  onView,
  onDelete,
  onSend,
}: {
  campaigns: EmailCampaignWithTemplate[]
  isLoading: boolean
  onView: (id: string) => void
  onDelete: (id: string) => void
  onSend: (id: string) => void
}) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="Geen campagnes"
        description="Maak je eerste email campagne aan"
      />
    )
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{campaign.name}</h3>
                  <CampaignStatusBadge status={campaign.status || 'draft'} />
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                  {campaign.template && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {campaign.template.name}
                    </span>
                  )}
                  {campaign.total_recipients && campaign.total_recipients > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {campaign.total_recipients} ontvangers
                    </span>
                  )}
                  {campaign.completed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(campaign.completed_at).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {campaign.status === 'sent' && (
                <div className="flex items-center gap-3 mr-4 text-sm">
                  <span className="text-green-400">
                    {campaign.total_opened || 0} geopend
                  </span>
                  <span className="text-neutral-500">
                    {campaign.total_clicked || 0} clicks
                  </span>
                </div>
              )}

              {campaign.status === 'draft' && (
                <button
                  onClick={() => onSend(campaign.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 text-amber-400 rounded-lg hover:bg-amber-400/20 transition-colors text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  Verstuur
                </button>
              )}

              <button
                onClick={() => onView(campaign.id)}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                title="Bekijken"
              >
                <Eye className="w-4 h-4" />
              </button>

              {campaign.status === 'draft' && (
                <button
                  onClick={() => onDelete(campaign.id)}
                  className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TemplatesList({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
}: {
  templates: any[]
  isLoading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
}) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create new template card */}
      <button
        onClick={onCreate}
        className="bg-neutral-900/50 border-2 border-dashed border-neutral-700 rounded-xl p-6 hover:border-amber-400/50 hover:bg-neutral-900 transition-colors group"
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[140px]">
          <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-400/20 transition-colors">
            <Plus className="w-6 h-6 text-amber-400" />
          </div>
          <span className="text-white font-medium">Nieuw Template</span>
          <span className="text-neutral-500 text-sm mt-1">
            Maak een herbruikbaar template
          </span>
        </div>
      </button>

      {/* Template cards */}
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(template.id)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(template.id)}
                className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 className="font-medium text-white mb-1">{template.name}</h3>
          <p className="text-sm text-neutral-400 line-clamp-1">{template.subject}</p>

          <div className="mt-3 pt-3 border-t border-neutral-800">
            <span className="text-xs text-neutral-500 px-2 py-0.5 bg-neutral-800 rounded">
              {template.category || 'general'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnalyticsDashboard({ campaigns }: { campaigns: EmailCampaignWithTemplate[] }) {
  const sentCampaigns = campaigns.filter(c => c.status === 'sent')

  if (sentCampaigns.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Geen analytics beschikbaar"
        description="Verstuur je eerste campagne om analytics te zien"
      />
    )
  }

  // Calculate totals
  const totals = sentCampaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + (c.total_sent || 0),
      delivered: acc.delivered + (c.total_delivered || 0),
      opened: acc.opened + (c.total_opened || 0),
      clicked: acc.clicked + (c.total_clicked || 0),
      bounced: acc.bounced + (c.total_bounced || 0),
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 }
  )

  const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0
  const openRate = totals.delivered > 0 ? Math.round((totals.opened / totals.delivered) * 100) : 0
  const clickRate = totals.opened > 0 ? Math.round((totals.clicked / totals.opened) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Verzonden" value={totals.sent} />
        <MetricCard label="Afgeleverd" value={totals.delivered} percentage={deliveryRate} />
        <MetricCard label="Geopend" value={totals.opened} percentage={openRate} />
        <MetricCard label="Clicks" value={totals.clicked} percentage={clickRate} />
        <MetricCard label="Bounced" value={totals.bounced} negative />
      </div>

      {/* Campaign performance */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Campagne Performance</h3>
        <div className="space-y-3">
          {sentCampaigns.slice(0, 10).map((campaign) => {
            const openRate = (campaign.total_delivered || 0) > 0
              ? Math.round(((campaign.total_opened || 0) / (campaign.total_delivered || 1)) * 100)
              : 0

            return (
              <div
                key={campaign.id}
                className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0"
              >
                <div>
                  <p className="text-white font-medium">{campaign.name}</p>
                  <p className="text-sm text-neutral-500">
                    {campaign.completed_at && new Date(campaign.completed_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white font-medium">{campaign.total_sent || 0}</p>
                    <p className="text-neutral-500">Verzonden</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{openRate}%</p>
                    <p className="text-neutral-500">Open rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{campaign.total_clicked || 0}</p>
                    <p className="text-neutral-500">Clicks</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  percentage,
  negative,
}: {
  label: string
  value: number
  percentage?: number
  negative?: boolean
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className={`text-2xl font-bold ${negative ? 'text-red-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </p>
      {percentage !== undefined && (
        <p className="text-sm text-neutral-500">{percentage}%</p>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-neutral-800 rounded w-1/4 mb-2" />
              <div className="h-3 bg-neutral-800 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-neutral-500" />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-neutral-500 text-sm">{description}</p>
    </div>
  )
}
