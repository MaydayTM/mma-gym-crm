import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Upload, Search, Filter, Users } from 'lucide-react'
import { Modal } from '../components/ui'
import { NewMemberForm } from '../components/members/NewMemberForm'
import { ImportMembersModal } from '../components/members/ImportMembersModal'
import { DuplicateReviewModal } from '../components/members/DuplicateReviewModal'
import { useMembers } from '../hooks/useMembers'

export function Members() {
  const navigate = useNavigate()
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: members, isLoading, error } = useMembers()

  const filteredMembers = members?.filter(member => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      member.first_name.toLowerCase().includes(query) ||
      member.last_name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Leden</h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            {members?.length ?? 0} leden in totaal
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDuplicateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition"
            style={{
              position: 'relative',
              '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              '--border-radius-before': '9999px',
            } as React.CSSProperties}
            title="Scan database op duplicaat leden"
          >
            <Users size={18} strokeWidth={1.5} />
            <span>Duplicaten</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition"
            style={{
              position: 'relative',
              '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              '--border-radius-before': '9999px',
            } as React.CSSProperties}
          >
            <Upload size={18} strokeWidth={1.5} />
            <span>Importeren</span>
          </button>
          <button
            onClick={() => setIsNewMemberModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
          >
            <UserPlus size={18} strokeWidth={1.5} />
            <span>Nieuw Lid</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Zoek op naam of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 text-[15px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-6 py-3 hover:bg-neutral-900 transition"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '9999px',
          } as React.CSSProperties}
        >
          <Filter size={18} strokeWidth={1.5} />
          <span>Filters</span>
        </button>
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-neutral-400 mt-4 text-[14px]">Leden laden...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/40 rounded-2xl">
          <p className="text-rose-300 text-[14px]">Fout bij laden: {(error as Error).message}</p>
        </div>
      ) : filteredMembers && filteredMembers.length > 0 ? (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-6 py-4">Lid</th>
                  <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-6 py-4">Contact</th>
                  <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-6 py-4">Disciplines</th>
                  <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-6 py-4">Gordel</th>
                  <th className="text-left text-[11px] font-medium text-neutral-500 uppercase tracking-[0.22em] px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member) => (
                  <tr key={member.id} onClick={() => navigate(`/members/${member.id}`)} className="hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex text-[11px] font-medium text-neutral-200 bg-neutral-800 w-9 h-9 rounded-2xl items-center justify-center">
                          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-neutral-50 tracking-tight">{member.first_name} {member.last_name}</p>
                          <p className="text-[11px] text-neutral-400 capitalize">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[14px] text-neutral-300">{member.email}</p>
                      <p className="text-[11px] text-neutral-500">{member.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.disciplines?.map((d) => (
                          <span key={d} className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-100 text-[11px] uppercase">
                            {d}
                          </span>
                        )) || <span className="text-neutral-500 text-[11px]">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.belt_color ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border border-white/20 ${getBeltColorClass(member.belt_color)}`} />
                          <span className="text-[14px] text-neutral-300 capitalize">
                            {member.belt_color}
                            {member.belt_stripes ? ` (${member.belt_stripes} str)` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ${getStatusClasses(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-12 text-center"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          <div className="w-16 h-16 mx-auto bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="text-neutral-500" size={24} strokeWidth={1.5} />
          </div>
          <h3 className="text-[20px] font-medium text-neutral-50">Geen leden gevonden</h3>
          <p className="text-[14px] text-neutral-500 mt-1">
            {searchQuery ? 'Probeer een andere zoekterm' : 'Voeg je eerste lid toe of importeer een CSV bestand'}
          </p>
          {!searchQuery && (
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 text-[14px] text-neutral-100 bg-gradient-to-br from-white/10 to-white/0 rounded-full px-5 py-2.5 hover:bg-neutral-900 transition"
                style={{
                  position: 'relative',
                  '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                  '--border-radius-before': '9999px',
                } as React.CSSProperties}
              >
                <Upload size={16} strokeWidth={1.5} />
                Importeren
              </button>
              <button
                onClick={() => setIsNewMemberModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-5 py-2.5 text-[14px] font-medium shadow-[0_16px_40px_rgba(251,191,36,0.55)] hover:bg-amber-200 transition"
              >
                <UserPlus size={16} strokeWidth={1.5} />
                Nieuw Lid
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Member Modal */}
      <Modal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        title="Nieuw Lid Toevoegen"
        size="lg"
      >
        <NewMemberForm
          onSuccess={() => setIsNewMemberModalOpen(false)}
          onCancel={() => setIsNewMemberModalOpen(false)}
        />
      </Modal>

      {/* Import Modal */}
      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Duplicate Review Modal */}
      <DuplicateReviewModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
      />
    </div>
  )
}

function getBeltColorClass(color: string | null): string {
  const colors: Record<string, string> = {
    white: 'bg-white',
    grey: 'bg-gray-400',
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    brown: 'bg-amber-700',
    black: 'bg-black',
    red: 'bg-red-600',
  }
  return colors[color || ''] || 'bg-gray-500'
}

function getStatusClasses(status: string | null): string {
  const statuses: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    frozen: 'bg-sky-500/10 text-sky-300 border-sky-500/40',
    cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
    lead: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
  }
  return statuses[status || ''] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/40'
}
