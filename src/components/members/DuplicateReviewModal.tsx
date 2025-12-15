import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Mail,
  Phone,
  Calendar,
  Activity,
  CreditCard,
  Loader2,
  Merge,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Modal } from '../ui'
import {
  useFindDuplicates,
  useMergeDuplicates,
  useMergeAllRecommended,
  getMatchTypeLabel,
  getConfidenceColor,
  type DuplicateGroup,
  type DuplicateMember,
} from '../../hooks/useDuplicateDetection'

interface DuplicateReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DuplicateReviewModal({ isOpen, onClose }: DuplicateReviewModalProps) {
  const { data: duplicateGroups, isLoading, refetch } = useFindDuplicates()
  const mergeDuplicates = useMergeDuplicates()
  const mergeAllRecommended = useMergeAllRecommended()

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [selectedMasters, setSelectedMasters] = useState<Map<number, string>>(new Map())

  // Initialize selected masters met aanbevolen
  const getSelectedMaster = (group: DuplicateGroup): string => {
    return selectedMasters.get(group.group_id) || group.recommended_master_id
  }

  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const selectMaster = (groupId: number, memberId: string) => {
    const newSelected = new Map(selectedMasters)
    newSelected.set(groupId, memberId)
    setSelectedMasters(newSelected)
  }

  const handleMergeGroup = async (group: DuplicateGroup) => {
    const masterId = getSelectedMaster(group)
    const duplicateIds = group.members
      .filter((m) => m.member_id !== masterId)
      .map((m) => m.member_id)

    await mergeDuplicates.mutateAsync({ masterId, duplicateIds })
  }

  const handleMergeAll = async () => {
    if (!duplicateGroups) return

    // Gebruik de geselecteerde masters in plaats van alleen aanbevolen
    const groupsWithSelection = duplicateGroups.map((group) => ({
      ...group,
      recommended_master_id: getSelectedMaster(group),
    }))

    await mergeAllRecommended.mutateAsync(groupsWithSelection)
  }

  const totalDuplicates = duplicateGroups?.reduce(
    (acc, group) => acc + group.members.length - 1,
    0
  ) || 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicaat Detectie" size="xl">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-400/10 rounded-xl">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[24px] font-bold text-white">
                {duplicateGroups?.length || 0}
              </p>
              <p className="text-[13px] text-neutral-400">
                groepen met duplicaten ({totalDuplicates} te verwijderen)
              </p>
            </div>
          </div>

          {duplicateGroups && duplicateGroups.length > 0 && (
            <button
              onClick={handleMergeAll}
              disabled={mergeAllRecommended.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {mergeAllRecommended.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Merge className="w-5 h-5" />
              )}
              <span>Alle Samenvoegen</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
            <p className="text-neutral-400">Scannen op duplicaten...</p>
          </div>
        )}

        {/* No Duplicates */}
        {!isLoading && (!duplicateGroups || duplicateGroups.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
            <p className="text-[18px] font-semibold text-white">Geen duplicaten gevonden</p>
            <p className="text-neutral-400 mt-1">Je database is schoon!</p>
          </div>
        )}

        {/* Duplicate Groups */}
        {duplicateGroups && duplicateGroups.length > 0 && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {duplicateGroups.map((group) => (
              <DuplicateGroupCard
                key={group.group_id}
                group={group}
                isExpanded={expandedGroups.has(group.group_id)}
                selectedMasterId={getSelectedMaster(group)}
                onToggle={() => toggleGroup(group.group_id)}
                onSelectMaster={(memberId) => selectMaster(group.group_id, memberId)}
                onMerge={() => handleMergeGroup(group)}
                isMerging={mergeDuplicates.isPending}
              />
            ))}
          </div>
        )}

        {/* Success Message */}
        {mergeAllRecommended.isSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Samenvoegen voltooid!</p>
                <p className="text-[13px] text-green-400/70">
                  {mergeAllRecommended.data?.totalDeleted} duplicaten verwijderd
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
          >
            Opnieuw Scannen
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-[15px] bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition"
          >
            Sluiten
          </button>
        </div>
      </div>
    </Modal>
  )
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  isExpanded: boolean
  selectedMasterId: string
  onToggle: () => void
  onSelectMaster: (memberId: string) => void
  onMerge: () => void
  isMerging: boolean
}

function DuplicateGroupCard({
  group,
  isExpanded,
  selectedMasterId,
  onToggle,
  onSelectMaster,
  onMerge,
  isMerging,
}: DuplicateGroupCardProps) {
  const masterMember = group.members.find((m) => m.member_id === selectedMasterId)
  const duplicateCount = group.members.length - 1

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header - Collapsed View */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-lg ${
              group.confidence >= 95
                ? 'bg-red-500/10'
                : group.confidence >= 80
                ? 'bg-orange-500/10'
                : 'bg-yellow-500/10'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${getConfidenceColor(group.confidence)}`}
            />
          </div>

          <div className="text-left">
            <p className="text-white font-medium">
              {masterMember?.first_name} {masterMember?.last_name}
              <span className="text-neutral-400 ml-2 text-[13px]">
                +{duplicateCount} duplica{duplicateCount === 1 ? 'at' : 'ten'}
              </span>
            </p>
            <p className="text-[13px] text-neutral-500">
              {getMatchTypeLabel(group.match_type)} • {group.confidence}% match
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMerge()
            }}
            disabled={isMerging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-[13px] rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
          >
            {isMerging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Merge</span>
          </button>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Expanded View - Member Comparison */}
      {isExpanded && (
        <div className="border-t border-white/10">
          <div className="p-4 space-y-2">
            <p className="text-[12px] text-neutral-500 uppercase tracking-wide mb-3">
              Selecteer welk profiel je wilt behouden (groen = aanbevolen):
            </p>

            {group.members.map((member) => (
              <MemberCompareRow
                key={member.member_id}
                member={member}
                isSelected={member.member_id === selectedMasterId}
                isRecommended={member.is_recommended_master}
                onSelect={() => onSelectMaster(member.member_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MemberCompareRowProps {
  member: DuplicateMember
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
}

function MemberCompareRow({
  member,
  isSelected,
  isRecommended,
  onSelect,
}: MemberCompareRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
        isSelected
          ? 'bg-amber-400/10 border-amber-400/50'
          : isRecommended
          ? 'bg-green-500/5 border-green-500/30 hover:bg-green-500/10'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Selection indicator */}
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected
              ? 'border-amber-400 bg-amber-400'
              : 'border-neutral-600'
          }`}
        >
          {isSelected && <CheckCircle2 className="w-3 h-3 text-neutral-950" />}
        </div>

        {/* Member info */}
        <div className="text-left">
          <p className="text-white font-medium flex items-center gap-2">
            {member.first_name} {member.last_name}
            {isRecommended && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                AANBEVOLEN
              </span>
            )}
          </p>
          <div className="flex items-center gap-4 mt-1 text-[12px] text-neutral-400">
            {member.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {member.email}
              </span>
            )}
            {member.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {member.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px]">
        <span
          className={`flex items-center gap-1 ${
            member.has_subscription ? 'text-green-400' : 'text-neutral-500'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          {member.has_subscription ? 'Abo' : 'Geen abo'}
        </span>
        <span className="flex items-center gap-1 text-neutral-400">
          <Activity className="w-3.5 h-3.5" />
          {member.total_checkins} check-ins
        </span>
        <span className="flex items-center gap-1 text-neutral-400">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(member.created_at).toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
          })}
        </span>
      </div>
    </button>
  )
}

export default DuplicateReviewModal
