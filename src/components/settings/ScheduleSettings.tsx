import { useState, useCallback } from 'react'
import { Calendar, Plus, Pencil, Trash2, Loader2, GripVertical, Upload, ImageIcon } from 'lucide-react'
import { useClassTracks, useCreateClassTrack, useUpdateClassTrack, useDeleteClassTrack } from '../../hooks/useClassTracks'
import { useDisciplines } from '../../hooks/useDisciplines'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../ui'

export function ScheduleSettings() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<{ id: string; name: string; description: string; color: string } | null>(null)

  const { data: tracks, isLoading } = useClassTracks(false) // Include inactive tracks
  const { mutate: deleteTrack, isPending: isDeleting } = useDeleteClassTrack()
  const { data: disciplines } = useDisciplines()
  const queryClient = useQueryClient()
  const [uploadingDisciplineId, setUploadingDisciplineId] = useState<string | null>(null)

  const handleDisciplineImageUpload = useCallback(async (disciplineId: string, file: File) => {
    setUploadingDisciplineId(disciplineId)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `disciplines/${disciplineId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL')

      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`
      const { error: updateError } = await supabase
        .from('disciplines')
        .update({ image_url: imageUrl })
        .eq('id', disciplineId)
      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['disciplines'] })
    } catch (err) {
      console.error('Discipline image upload failed:', err)
      alert('Upload mislukt: ' + (err instanceof Error ? err.message : 'Onbekende fout'))
    } finally {
      setUploadingDisciplineId(null)
    }
  }, [queryClient])

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Weet je zeker dat je "${name}" wilt verwijderen? Lessen met deze track behouden hun track, maar deze wordt niet meer getoond.`)) {
      deleteTrack(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sky-400/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Rooster Instellingen</h2>
            <p className="text-sm text-neutral-400">Beheer tracks en andere rooster opties</p>
          </div>
        </div>

        {/* Tracks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Les Tracks</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tracks categoriseren lessen (bijv. Core/Competitive, Groep I/II)
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg transition"
            >
              <Plus size={16} />
              Track Toevoegen
            </button>
          </div>

          {/* Tracks List */}
          <div className="space-y-2">
            {tracks && tracks.length > 0 ? (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    track.is_active
                      ? 'bg-neutral-900 border-neutral-800'
                      : 'bg-neutral-900/50 border-neutral-800/50 opacity-60'
                  }`}
                >
                  <div className="text-neutral-600 cursor-grab">
                    <GripVertical size={16} />
                  </div>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: track.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{track.name}</span>
                      {!track.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400">
                          Inactief
                        </span>
                      )}
                    </div>
                    {track.description && (
                      <p className="text-xs text-neutral-500 truncate">{track.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTrack({
                        id: track.id,
                        name: track.name,
                        description: track.description || '',
                        color: track.color || '#6B7280',
                      })}
                      className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(track.id, track.name)}
                      disabled={isDeleting}
                      className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Nog geen tracks. Voeg een track toe om lessen te categoriseren.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disciplines Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ImageIcon size={16} className="text-sky-400" />
              Disciplines
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Beheer afbeeldingen voor disciplines in de app en het rooster
            </p>
          </div>

          <div className="space-y-2">
            {disciplines && disciplines.length > 0 ? (
              disciplines.map((discipline) => (
                <div
                  key={discipline.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  {/* Thumbnail or color dot */}
                  {discipline.image_url ? (
                    <img
                      src={discipline.image_url}
                      alt={discipline.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${discipline.color || '#6B7280'}20` }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: discipline.color || '#6B7280' }}
                      />
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white">{discipline.name}</span>
                    {discipline.image_url && (
                      <p className="text-[11px] text-neutral-500 truncate">Afbeelding ingesteld</p>
                    )}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/jpeg,image/png,image/webp'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) handleDisciplineImageUpload(discipline.id, file)
                      }
                      input.click()
                    }}
                    disabled={uploadingDisciplineId === discipline.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                  >
                    {uploadingDisciplineId === discipline.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {discipline.image_url ? 'Wijzigen' : 'Upload'}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Geen disciplines gevonden.
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-500">
            Aanbevolen: 400x400px, vierkant, JPG of PNG
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4">
        <p className="text-sm text-sky-300/80">
          <strong className="text-sky-300">Tip:</strong> Tracks worden getoond in het rooster bij lessen.
          Je kunt de naamgeving aanpassen naar wat past bij jouw gym (Core/Competitive,
          Groep I/II, Beginners/Gevorderden, etc.)
        </p>
      </div>

      {/* Add Track Modal */}
      <TrackFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="create"
      />

      {/* Edit Track Modal */}
      {editingTrack && (
        <TrackFormModal
          isOpen={true}
          onClose={() => setEditingTrack(null)}
          mode="edit"
          initialData={editingTrack}
        />
      )}
    </div>
  )
}

// Color picker presets
const COLOR_PRESETS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
]

function TrackFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: { id: string; name: string; description: string; color: string }
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [color, setColor] = useState(initialData?.color || '#3B82F6')

  const { mutate: createTrack, isPending: isCreating } = useCreateClassTrack()
  const { mutate: updateTrack, isPending: isUpdating } = useUpdateClassTrack()

  const isPending = isCreating || isUpdating

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trackData = {
      name,
      description: description || null,
      color,
    }

    if (mode === 'create') {
      createTrack(trackData, {
        onSuccess: () => {
          setName('')
          setDescription('')
          setColor('#3B82F6')
          onClose()
        },
      })
    } else if (initialData) {
      updateTrack(
        { id: initialData.id, ...trackData },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nieuwe Track' : 'Track Bewerken'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Naam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Core, Competitive, Groep I..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Beschrijving
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Korte beschrijving van deze track..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Kleur
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === preset ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-neutral-800 rounded-xl">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-2">Preview</p>
          <span
            className="inline-block text-[11px] font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {name || 'Track naam'}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isPending || !name}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {mode === 'create' ? 'Toevoegen' : 'Opslaan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
