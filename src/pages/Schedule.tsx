import { useState } from 'react'
import { Plus, Loader2, Trash2, Filter } from 'lucide-react'
import { Modal } from '../components/ui'
import { useClasses, useCreateClass, useCreateRecurringClass, useUpdateClass, useDeleteClass } from '../hooks/useClasses'
import { useDisciplines } from '../hooks/useDisciplines'
import { useMembers } from '../hooks/useMembers'
import { useClassTracks } from '../hooks/useClassTracks'
import { useRooms } from '../hooks/useRooms'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

type ClassWithRelations = {
  id: string
  name: string
  discipline_id: string
  coach_id: string | null
  track_id: string | null
  room_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number | null
  room: string | null
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
  track: { id: string; name: string; color: string } | null
  room_rel: { id: string; name: string; color: string } | null
}

export function Schedule() {
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(null)
  const [filterRoom, setFilterRoom] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)

  const { data: classes, isLoading } = useClasses()
  const { data: rooms } = useRooms()
  const { mutate: updateClass } = useUpdateClass()

  // Handle drop of a class to a new day/room
  const handleDrop = (classId: string, newDayOfWeek: number, newRoomId: string | null) => {
    updateClass({
      id: classId,
      day_of_week: newDayOfWeek,
      room_id: newRoomId,
    })
  }

  // Filter classes by room if filter is active
  const filteredClasses = filterRoom
    ? classes?.filter((c) => c.room_id === filterRoom)
    : classes

  // Group classes by day and room
  const getClassesForDayAndRoom = (dayIndex: number, roomId: string | null) => {
    return filteredClasses
      ?.filter((c) => c.day_of_week === dayIndex && c.room_id === roomId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)) || []
  }

  const todayIndex = new Date().getDay()

  return (
    <div className="space-y-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Rooster</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Lesrooster en planning</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Room Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-4 py-2 border border-neutral-800">
            <Filter size={16} className="text-neutral-500" />
            <select
              value={filterRoom || ''}
              onChange={(e) => setFilterRoom(e.target.value || null)}
              className="bg-transparent text-[14px] text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="">Alle zalen</option>
              {rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsNewClassModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
          >
            <Plus size={18} strokeWidth={1.5} />
            <span>Nieuwe Les</span>
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : (
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          {/* Day headers with room sub-headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`border-r border-white/5 last:border-r-0 ${
                  i === todayIndex ? 'bg-amber-500/10' : ''
                }`}
              >
                {/* Day name */}
                <div className="p-3 text-center border-b border-white/5">
                  <span className="hidden md:inline text-[14px] font-medium text-neutral-300">
                    {day}
                  </span>
                  <span className="md:hidden text-[14px] font-medium text-neutral-300">
                    {DAYS_SHORT[i]}
                  </span>
                </div>
                {/* Room sub-headers */}
                {!filterRoom && rooms && rooms.length > 0 && (
                  <div className="grid grid-cols-2">
                    {rooms.map((room, roomIdx) => (
                      <div
                        key={room.id}
                        className={`p-2 text-center ${roomIdx === 0 ? 'border-r border-white/5' : ''}`}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: room.color || '#6B7280' }}
                        >
                          <span className="hidden lg:inline">{room.name}</span>
                          <span className="lg:hidden">{room.name.split(' ')[0]}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Classes grid with split columns */}
          <div className="grid grid-cols-7 min-h-[500px]">
            {DAYS.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className={`border-r border-white/5 last:border-r-0 ${
                  dayIndex === todayIndex ? 'bg-amber-500/5' : ''
                }`}
              >
                {!filterRoom && rooms && rooms.length > 0 ? (
                  // Split view: show both rooms
                  <div className="grid grid-cols-2 h-full">
                    {rooms.map((room, roomIdx) => {
                      const zoneId = `${dayIndex}-${room.id}`
                      return (
                        <DropZone
                          key={room.id}
                          zoneId={zoneId}
                          dayIndex={dayIndex}
                          roomId={room.id}
                          isOver={dragOverZone === zoneId}
                          onDragOver={() => setDragOverZone(zoneId)}
                          onDragLeave={() => setDragOverZone(null)}
                          onDrop={handleDrop}
                          className={`p-1.5 space-y-1.5 min-h-[100px] ${roomIdx === 0 ? 'border-r border-white/5' : ''}`}
                        >
                          {getClassesForDayAndRoom(dayIndex, room.id).map((cls) => (
                            <DraggableClassCard
                              key={cls.id}
                              cls={cls as ClassWithRelations}
                              compact
                              onClick={() => setEditingClass(cls as ClassWithRelations)}
                            />
                          ))}
                          {/* Show unassigned classes in first column */}
                          {roomIdx === 0 && getClassesForDayAndRoom(dayIndex, null).map((cls) => (
                            <DraggableClassCard
                              key={cls.id}
                              cls={cls as ClassWithRelations}
                              compact
                              unassigned
                              onClick={() => setEditingClass(cls as ClassWithRelations)}
                            />
                          ))}
                        </DropZone>
                      )
                    })}
                  </div>
                ) : (
                  // Single room view or no rooms
                  (() => {
                    const zoneId = `${dayIndex}-${filterRoom || 'all'}`
                    return (
                      <DropZone
                        zoneId={zoneId}
                        dayIndex={dayIndex}
                        roomId={filterRoom}
                        isOver={dragOverZone === zoneId}
                        onDragOver={() => setDragOverZone(zoneId)}
                        onDragLeave={() => setDragOverZone(null)}
                        onDrop={handleDrop}
                        className="p-2 space-y-2 min-h-[100px]"
                      >
                        {(filterRoom
                          ? getClassesForDayAndRoom(dayIndex, filterRoom)
                          : filteredClasses?.filter((c) => c.day_of_week === dayIndex).sort((a, b) => a.start_time.localeCompare(b.start_time)) || []
                        ).map((cls) => (
                          <DraggableClassCard
                            key={cls.id}
                            cls={cls as ClassWithRelations}
                            onClick={() => setEditingClass(cls as ClassWithRelations)}
                          />
                        ))}
                      </DropZone>
                    )
                  })()
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Discipline legend */}
        {classes && classes.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {Array.from(new Set(classes.map((c) => c.disciplines?.name))).map((name) => {
              const discipline = classes.find((c) => c.disciplines?.name === name)?.disciplines
              if (!discipline) return null
              return (
                <div key={name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: discipline.color }}
                  />
                  <span className="text-[12px] text-neutral-400">{name}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Room legend */}
        {rooms && rooms.length > 0 && (
          <>
            <div className="w-px h-4 bg-neutral-700" />
            <div className="flex gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: room.color || '#6B7280' }}
                  />
                  <span className="text-[12px] text-neutral-400">{room.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Class Modal */}
      <NewClassModal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
      />

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          classData={editingClass}
          onClose={() => setEditingClass(null)}
        />
      )}
    </div>
  )
}

// Drop Zone component for drag & drop
function DropZone({
  dayIndex,
  roomId,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  className,
  children,
}: {
  zoneId: string // Used by parent for tracking which zone is hovered
  dayIndex: number
  roomId: string | null
  isOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (classId: string, dayOfWeek: number, roomId: string | null) => void
  className?: string
  children: React.ReactNode
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger if leaving the actual element, not children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onDragLeave()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDragLeave()
    const classId = e.dataTransfer.getData('text/plain')
    if (classId) {
      onDrop(classId, dayIndex, roomId)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-colors ${className} ${
        isOver ? 'bg-amber-500/10 ring-2 ring-amber-400/50 ring-inset' : ''
      }`}
    >
      {children}
    </div>
  )
}

// Draggable Class Card component
function DraggableClassCard({
  cls,
  compact = false,
  unassigned = false,
  onClick,
}: {
  cls: ClassWithRelations
  compact?: boolean
  unassigned?: boolean
  onClick: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', cls.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`rounded-xl cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-white/20 transition select-none ${
        compact ? 'p-2' : 'p-3'
      } ${unassigned ? 'opacity-60 border border-dashed border-neutral-600' : ''} ${
        isDragging ? 'opacity-50 ring-2 ring-amber-400' : ''
      }`}
      style={{ backgroundColor: `${cls.disciplines?.color || '#3B82F6'}20` }}
    >
      <p
        className={`font-medium truncate ${compact ? 'text-[10px]' : 'text-[12px]'}`}
        style={{ color: cls.disciplines?.color || '#3B82F6' }}
      >
        {cls.name}
      </p>
      <p className={`text-neutral-400 mt-0.5 ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
        {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
      </p>
      {cls.track && (
        <span
          className={`inline-block font-medium px-1 py-0.5 rounded mt-1 ${compact ? 'text-[8px]' : 'text-[9px]'}`}
          style={{
            backgroundColor: `${cls.track.color}20`,
            color: cls.track.color,
          }}
        >
          {cls.track.name}
        </span>
      )}
      {!compact && cls.coach && (
        <p className="text-[10px] text-neutral-500 mt-1 truncate">
          {cls.coach.first_name} {cls.coach.last_name}
        </p>
      )}
      {unassigned && (
        <p className="text-[8px] text-neutral-500 mt-1 italic">Geen zaal</p>
      )}
    </div>
  )
}

function NewClassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [trackId, setTrackId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('20:00')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const { data: disciplines } = useDisciplines()
  const { data: coaches } = useMembers({ role: 'coach' })
  const { data: tracks } = useClassTracks()
  const { data: rooms } = useRooms()
  const { mutate: createClass, isPending: isCreating } = useCreateClass()
  const { mutate: createRecurringClass, isPending: isCreatingRecurring } = useCreateRecurringClass()

  const isPending = isCreating || isCreatingRecurring

  // Bereken minimum en default einddatum (3 maanden vanaf nu)
  const today = new Date()
  const minEndDate = today.toISOString().split('T')[0]
  const defaultEndDate = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const classData = {
      name,
      discipline_id: disciplineId,
      coach_id: coachId || null,
      track_id: trackId || null,
      room_id: roomId || null,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      room: null, // Legacy field, now using room_id
    }

    const resetForm = () => {
      setName('')
      setDisciplineId('')
      setCoachId('')
      setTrackId('')
      setRoomId('')
      setDayOfWeek(1)
      setStartTime('19:00')
      setEndTime('20:00')
      setMaxCapacity('')
      setIsRecurring(false)
      setRecurrenceEndDate('')
      onClose()
    }

    if (isRecurring && recurrenceEndDate) {
      createRecurringClass(
        { classData, recurrenceEndDate },
        { onSuccess: resetForm }
      )
    } else {
      createClass(classData, { onSuccess: resetForm })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nieuwe Les" size="md">
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
            placeholder="BJJ Fundamentals"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Discipline *
            </label>
            <select
              value={disciplineId}
              onChange={(e) => setDisciplineId(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              <option value="">Selecteer...</option>
              {disciplines?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Coach
            </label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              <option value="">Selecteer...</option>
              {coaches?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Selection - MK Themed! */}
        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Zaal *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {rooms?.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomId(room.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  roomId === room.id
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: room.color || '#6B7280' }}
                  />
                  <div>
                    <p className="text-[14px] font-medium text-neutral-100">{room.name}</p>
                    {room.capacity && (
                      <p className="text-[11px] text-neutral-500">Max {room.capacity} personen</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Track
          </label>
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
          >
            <option value="">Geen track (iedereen)</option>
            {tracks?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Dag *
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
          >
            {DAYS.map((day, i) => (
              <option key={i} value={i}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Start tijd *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            />
          </div>
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Eind tijd *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
            Max capaciteit
          </label>
          <input
            type="number"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            placeholder="Onbeperkt"
            min="1"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
          />
        </div>

        {/* Recurring options */}
        <div className="p-4 bg-white/5 rounded-xl space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.target.checked)
                if (e.target.checked && !recurrenceEndDate) {
                  setRecurrenceEndDate(defaultEndDate)
                }
              }}
              className="w-5 h-5 rounded border-neutral-600 bg-neutral-900 text-amber-300 focus:ring-amber-300/50 focus:ring-offset-0"
            />
            <div>
              <span className="text-[14px] text-neutral-200">Wekelijks herhalen</span>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Maak automatisch les-instances aan tot de einddatum
              </p>
            </div>
          </label>

          {isRecurring && (
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Herhalen tot en met
              </label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                min={minEndDate}
                required={isRecurring}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              />
              {recurrenceEndDate && (
                <p className="text-[11px] text-neutral-500 mt-2">
                  Dit genereert ongeveer {Math.ceil(
                    (new Date(recurrenceEndDate).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)
                  )} les-instances
                </p>
              )}
            </div>
          )}
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
            disabled={isPending || !name || !disciplineId || (isRecurring && !recurrenceEndDate)}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending
              ? (isRecurring ? 'Aanmaken...' : 'Opslaan...')
              : (isRecurring ? 'Recurring Les Aanmaken' : 'Aanmaken')
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditClassModal({
  classData,
  onClose,
}: {
  classData: ClassWithRelations
  onClose: () => void
}) {
  const [name, setName] = useState(classData.name)
  const [disciplineId, setDisciplineId] = useState(classData.discipline_id)
  const [coachId, setCoachId] = useState(classData.coach_id || '')
  const [trackId, setTrackId] = useState(classData.track_id || '')
  const [roomId, setRoomId] = useState(classData.room_id || '')
  const [dayOfWeek, setDayOfWeek] = useState(classData.day_of_week)
  const [startTime, setStartTime] = useState(classData.start_time.slice(0, 5))
  const [endTime, setEndTime] = useState(classData.end_time.slice(0, 5))
  const [maxCapacity, setMaxCapacity] = useState(classData.max_capacity?.toString() || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: disciplines } = useDisciplines()
  const { data: coaches } = useMembers({ role: 'coach' })
  const { data: tracks } = useClassTracks()
  const { data: rooms } = useRooms()
  const { mutate: updateClass, isPending: isUpdating } = useUpdateClass()
  const { mutate: deleteClass, isPending: isDeleting } = useDeleteClass()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    updateClass(
      {
        id: classData.id,
        name,
        discipline_id: disciplineId,
        coach_id: coachId || null,
        track_id: trackId || null,
        room_id: roomId || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
        room: null,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const handleDelete = () => {
    deleteClass(classData.id, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  const isPending = isUpdating || isDeleting

  return (
    <Modal isOpen={true} onClose={onClose} title="Les Bewerken" size="md">
      {showDeleteConfirm ? (
        <div className="space-y-4">
          <p className="text-neutral-300 text-[14px]">
            Weet je zeker dat je <strong className="text-neutral-100">{classData.name}</strong> wilt verwijderen?
          </p>
          <p className="text-neutral-500 text-[13px]">
            Deze actie kan niet ongedaan worden gemaakt.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
              className="px-6 py-3 text-[15px] text-neutral-300 hover:text-neutral-50 transition"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 text-white px-6 py-3 text-[15px] font-medium hover:bg-rose-400 transition disabled:opacity-50"
            >
              {isDeleting && <Loader2 size={18} className="animate-spin" />}
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </button>
          </div>
        </div>
      ) : (
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
              placeholder="BJJ Fundamentals"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Discipline *
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                <option value="">Selecteer...</option>
                {disciplines?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Coach
              </label>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              >
                <option value="">Selecteer...</option>
                {coaches?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Zaal
            </label>
            <div className="grid grid-cols-2 gap-3">
              {rooms?.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setRoomId(room.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    roomId === room.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-neutral-700 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: room.color || '#6B7280' }}
                    />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-100">{room.name}</p>
                      {room.capacity && (
                        <p className="text-[11px] text-neutral-500">Max {room.capacity} personen</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Track
            </label>
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              <option value="">Geen track (iedereen)</option>
              {tracks?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Dag *
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Start tijd *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              />
            </div>
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Eind tijd *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Max capaciteit
            </label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Onbeperkt"
              min="1"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 text-[14px] transition"
            >
              <Trash2 size={16} />
              Verwijderen
            </button>
            <div className="flex gap-3">
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
                disabled={isPending || !name || !disciplineId}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isUpdating && <Loader2 size={18} className="animate-spin" />}
                {isUpdating ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
