import { useState } from 'react'
import {
  ArrowLeft,
  Send,
  Users,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TestTube,
  BarChart3,
  Loader2,
} from 'lucide-react'
import {
  useEmailCampaign,
  useCampaignSends,
  useSendCampaign,
} from '../../hooks/useEmailCampaigns'
import type { Database } from '../../types/database.types'

interface CampaignDetailProps {
  campaignId: string
  onBack: () => void
}

export function CampaignDetail({ campaignId, onBack }: CampaignDetailProps) {
  const { data: campaign, isLoading: campaignLoading } = useEmailCampaign(campaignId)
  const { data: sends, isLoading: sendsLoading } = useCampaignSends(campaignId)
  const sendCampaign = useSendCampaign()

  const [activeTab, setActiveTab] = useState<'overview' | 'recipients'>('overview')

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400">Campagne niet gevonden</p>
      </div>
    )
  }

  const handleSend = (testMode: boolean) => {
    const message = testMode
      ? 'Wil je een test email versturen naar de eerste ontvanger?'
      : `Weet je zeker dat je deze campagne wilt versturen naar ${campaign.audience_count || campaign.total_recipients || 0} ontvangers?`

    if (confirm(message)) {
      sendCampaign.mutate({ campaignId, testMode })
    }
  }

  const stats = {
    sent: campaign.total_sent || 0,
    delivered: campaign.total_delivered || 0,
    opened: campaign.total_opened || 0,
    clicked: campaign.total_clicked || 0,
    bounced: campaign.total_bounced || 0,
  }

  const deliveryRate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0
  const openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0
  const clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0

  const isSent = campaign.status === 'sent'
  const isDraft = campaign.status === 'draft'
  const isSending = campaign.status === 'sending' || sendCampaign.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{campaign.name}</h1>
              <StatusBadge status={campaign.status || 'draft'} />
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              {campaign.template?.name || 'Custom content'}
            </p>
          </div>
        </div>

        {isDraft && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSend(true)}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <TestTube className="w-4 h-4" />
              <span>Test Versturen</span>
            </button>
            <button
              onClick={() => handleSend(false)}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Verstuur Campagne</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats (for sent campaigns) */}
      {isSent && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Send} label="Verzonden" value={stats.sent} />
          <StatCard
            icon={CheckCircle}
            label="Afgeleverd"
            value={stats.delivered}
            percentage={deliveryRate}
            color="green"
          />
          <StatCard
            icon={Eye}
            label="Geopend"
            value={stats.opened}
            percentage={openRate}
            color="blue"
          />
          <StatCard
            icon={MousePointerClick}
            label="Clicks"
            value={stats.clicked}
            percentage={clickRate}
            color="purple"
          />
          <StatCard
            icon={AlertTriangle}
            label="Bounced"
            value={stats.bounced}
            color="red"
          />
        </div>
      )}

      {/* Draft info */}
      {isDraft && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {campaign.audience_count || '?'}
              </p>
              <p className="text-neutral-400">Ontvangers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Onderwerp</p>
              <p className="text-white font-medium">
                {campaign.subject || campaign.template?.subject || '-'}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Aangemaakt</p>
              <p className="text-white font-medium">
                {campaign.created_at && new Date(campaign.created_at).toLocaleString('nl-NL')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs (for sent campaigns) */}
      {isSent && (
        <>
          <div className="flex items-center gap-2 border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overzicht</span>
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'recipients'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Ontvangers ({sends?.length || 0})</span>
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Campagne Details</h3>
              <div className="space-y-3 text-sm">
                <DetailRow
                  label="Verzonden op"
                  value={campaign.completed_at ? new Date(campaign.completed_at).toLocaleString('nl-NL') : '-'}
                />
                <DetailRow
                  label="Onderwerp"
                  value={campaign.subject || campaign.template?.subject || '-'}
                />
                <DetailRow
                  label="Template"
                  value={campaign.template?.name || 'Custom content'}
                />
              </div>
            </div>
          )}

          {activeTab === 'recipients' && (
            <RecipientsList sends={sends || []} isLoading={sendsLoading} />
          )}
        </>
      )}

      {/* Content preview */}
      {isDraft && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800">
            <h3 className="font-semibold text-white">Email Preview</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-neutral-400 mb-2">
              <strong>Onderwerp:</strong>{' '}
              {campaign.subject || campaign.template?.subject}
            </p>
            <div
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: campaign.body_html || campaign.template?.body_html || '',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-neutral-500/20 text-neutral-300', label: 'Concept' },
    scheduled: { color: 'bg-blue-500/20 text-blue-300', label: 'Gepland' },
    sending: { color: 'bg-amber-500/20 text-amber-300', label: 'Bezig...' },
    sent: { color: 'bg-green-500/20 text-green-300', label: 'Verzonden' },
    cancelled: { color: 'bg-red-500/20 text-red-300', label: 'Geannuleerd' },
  }

  const { color, label } = config[status] || config.draft

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  percentage,
  color = 'amber',
}: {
  icon: React.ElementType
  label: string
  value: number
  percentage?: number
  color?: 'amber' | 'green' | 'blue' | 'purple' | 'red'
}) {
  const colors = {
    amber: 'bg-amber-400/10 text-amber-400',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    red: 'bg-red-500/10 text-red-400',
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
          <p className="text-sm text-neutral-400">{label}</p>
          {percentage !== undefined && (
            <p className="text-xs text-neutral-500">{percentage}%</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-800 last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  )
}

type EmailSendWithMember = Database['public']['Tables']['email_sends']['Row'] & {
  member?: { first_name: string; last_name: string } | null
}

function RecipientsList({
  sends,
  isLoading,
}: {
  sends: EmailSendWithMember[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }

  if (sends.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400">
        Geen ontvangers gevonden
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
              Ontvanger
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
              Status
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
              Geopend
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
              Clicks
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">
              Verzonden
            </th>
          </tr>
        </thead>
        <tbody>
          {sends.map((send) => (
            <tr
              key={send.id}
              className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="text-white font-medium">
                    {send.member?.first_name} {send.member?.last_name}
                  </p>
                  <p className="text-sm text-neutral-500">{send.recipient_email}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <SendStatusBadge status={send.status || 'pending'} />
              </td>
              <td className="px-4 py-3">
                {(send.open_count ?? 0) > 0 ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Eye className="w-4 h-4" />
                    <span>{send.open_count}x</span>
                  </div>
                ) : (
                  <span className="text-neutral-500">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                {(send.click_count ?? 0) > 0 ? (
                  <span className="text-purple-400">{send.click_count}x</span>
                ) : (
                  <span className="text-neutral-500">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-400 text-sm">
                {send.sent_at
                  ? new Date(send.sent_at).toLocaleString('nl-NL', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SendStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-neutral-400', label: 'Wachtend' },
    sent: { icon: Send, color: 'text-blue-400', label: 'Verzonden' },
    delivered: { icon: CheckCircle, color: 'text-green-400', label: 'Afgeleverd' },
    opened: { icon: Eye, color: 'text-green-400', label: 'Geopend' },
    clicked: { icon: MousePointerClick, color: 'text-purple-400', label: 'Geklikt' },
    bounced: { icon: AlertTriangle, color: 'text-red-400', label: 'Bounced' },
    complained: { icon: XCircle, color: 'text-red-400', label: 'Spam' },
    failed: { icon: XCircle, color: 'text-red-400', label: 'Mislukt' },
  }

  const { icon: Icon, color, label } = config[status] || config.pending

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
