import { useState, useMemo } from 'react'
import { Plus, Loader2, Trash2, Filter, ChevronLeft, ChevronRight, Calendar, CheckSquare, Square, X } from 'lucide-react'
import { Modal } from '../components/ui'
import { useClasses, useCreateClass, useCreateRecurringClass, useUpdateClass, useDeleteClass, useBulkDeleteClasses } from '../hooks/useClasses'
import { useDisciplines } from '../hooks/useDisciplines'
import { useMembers } from '../hooks/useMembers'
import { useClassTracks } from '../hooks/useClassTracks'
import { useRooms } from '../hooks/useRooms'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']

type ViewMode = 'day' | 'week' | 'month'

// Helper functions for date calculations
function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(date)
  monday.setDate(diff)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Start from the Monday of the first week
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  startDate.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  // End on the Sunday of the last week
  const endDate = new Date(lastDay)
  const lastDayOfWeek = lastDay.getDay()
  endDate.setDate(lastDay.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek))

  const dates: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear()
}

function formatDateRange(viewMode: ViewMode, date: Date): string {
  if (viewMode === 'day') {
    return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  } else if (viewMode === 'week') {
    const weekDates = getWeekDates(date)
    const start = weekDates[0]
    const end = weekDates[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`
    } else {
      return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`
    }
  } else {
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  }
}

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
  start_date: string | null
  recurrence_end_date: string | null
  is_recurring: boolean | null
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
  track: { id: string; name: string; color: string } | null
  room_rel: { id: string; name: string; color: string } | null
}

// Check if a class is active on a given date
function isClassActiveOnDate(cls: ClassWithRelations, date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]

  // BELANGRIJK: Als start_date niet is ingesteld, kan de class niet worden getoond
  // Dit voorkomt dat oude classes zonder datum op elke week verschijnen
  if (!cls.start_date) {
    return false
  }

  // Check start_date: class moet gestart zijn
  if (cls.start_date > dateStr) {
    return false
  }

  // Check recurrence_end_date: class mag niet beëindigd zijn
  // BELANGRIJK: Als recurrence_end_date NULL is EN het GEEN recurring class is,
  // dan is het een éénmalige class en mag alleen op de start_date getoond worden
  if (!cls.recurrence_end_date) {
    // Geen einddatum: alleen tonen als de datum exact overeenkomt met start_date
    // OF als is_recurring expliciet true is (dan is het een bug in de data)
    if (!cls.is_recurring) {
      // Éénmalige class: alleen op start_date tonen
      return cls.start_date === dateStr
    }
    // Recurring zonder einddatum: dit is een data-probleem, toon niet
    // (classes moeten altijd een einddatum hebben)
    return false
  }

  // Check of de datum binnen de einddatum valt
  if (cls.recurrence_end_date < dateStr) {
    return false
  }

  return true
}

export function Schedule() {
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(null)
  const [filterRoom, setFilterRoom] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())

  const { data: classes, isLoading } = useClasses()
  const { data: rooms } = useRooms()
  const { mutate: updateClass } = useUpdateClass()
  const { mutate: bulkDeleteClasses, isPending: isBulkDeleting } = useBulkDeleteClasses()

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(classId)) {
        next.delete(classId)
      } else {
        next.add(classId)
      }
      return next
    })
  }

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedClasses(new Set())
  }

  // Bulk delete selected classes
  const handleBulkDelete = () => {
    if (selectedClasses.size === 0) return
    bulkDeleteClasses(Array.from(selectedClasses), {
      onSuccess: () => {
        exitSelectionMode()
      },
    })
  }

  const today = useMemo(() => new Date(), [])

  // Check if a date is today
  const isToday = (date: Date) => isSameDay(date, today)

  // Navigation functions
  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get dates for current view
  const viewDates = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate]
    } else if (viewMode === 'week') {
      return getWeekDates(currentDate)
    } else {
      return getMonthDates(currentDate)
    }
  }, [viewMode, currentDate])

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

  // Group classes by day, room, and check if active on the given date
  const getClassesForDayAndRoom = (date: Date, roomId: string | null) => {
    const dayOfWeek = date.getDay()
    return filteredClasses
      ?.filter((c) =>
        c.day_of_week === dayOfWeek &&
        c.room_id === roomId &&
        isClassActiveOnDate(c as ClassWithRelations, date)
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time)) || []
  }

  // Get classes for a specific date (for month view)
  const getClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    return filteredClasses
      ?.filter((c) =>
        c.day_of_week === dayOfWeek &&
        isClassActiveOnDate(c as ClassWithRelations, date)
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time)) || []
  }

  return (
    <div className="space-y-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Rooster</h1>
            <p className="text-[14px] text-neutral-400 mt-1">Lesrooster en planning</p>
          </div>
          <div className="flex items-center gap-3">
            {selectionMode ? (
              // Selection mode controls
              <>
                <span className="text-[14px] text-neutral-300">
                  {selectedClasses.size} geselecteerd
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedClasses.size === 0 || isBulkDeleting}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500 text-white px-5 py-2.5 text-[14px] font-medium hover:bg-rose-400 transition disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Verwijderen
                </button>
                <button
                  onClick={exitSelectionMode}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-700 text-neutral-200 px-5 py-2.5 text-[14px] font-medium hover:bg-neutral-600 transition"
                >
                  <X size={16} />
                  Annuleren
                </button>
              </>
            ) : (
              // Normal mode controls
              <>
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
                  onClick={() => setSelectionMode(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-800 text-neutral-300 px-4 py-2.5 text-[14px] font-medium hover:bg-neutral-700 transition border border-neutral-700"
                >
                  <CheckSquare size={16} />
                  Selecteren
                </button>
                <button
                  onClick={() => setIsNewClassModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
                >
                  <Plus size={18} strokeWidth={1.5} />
                  <span>Nieuwe Les</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/50 rounded-2xl p-3 border border-neutral-800">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-xl p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-[13px] font-medium rounded-lg transition ${
                  viewMode === mode
                    ? 'bg-amber-400 text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode === 'day' ? 'Dag' : mode === 'week' ? 'Week' : 'Maand'}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-[13px] font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition flex items-center gap-2"
            >
              <Calendar size={14} />
              Vandaag
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('prev')}
                className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-[14px] font-medium text-neutral-200 min-w-[200px] text-center">
                {formatDateRange(viewMode, currentDate)}
              </span>
              <button
                onClick={() => navigate('next')}
                className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={32} />
        </div>
      ) : viewMode === 'month' ? (
        // Month View - Calendar Grid
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          {/* Day name headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
              <div key={day} className="p-3 text-center border-r border-white/5 last:border-r-0">
                <span className="text-[14px] font-medium text-neutral-300">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {viewDates.map((date, idx) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const dayClasses = getClassesForDate(date)

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-r border-b border-white/5 last:border-r-0 p-2 ${
                    isToday(date) ? 'bg-amber-500/10' : ''
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`text-[13px] font-medium mb-2 ${
                    isToday(date) ? 'text-amber-400' : 'text-neutral-400'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayClasses.slice(0, 3).map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => setEditingClass(cls as ClassWithRelations)}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:ring-1 hover:ring-white/20"
                        style={{
                          backgroundColor: `${cls.disciplines?.color || '#3B82F6'}20`,
                          color: cls.disciplines?.color || '#3B82F6',
                        }}
                      >
                        {cls.start_time.slice(0, 5)} {cls.name}
                      </div>
                    ))}
                    {dayClasses.length > 3 && (
                      <div className="text-[10px] text-neutral-500">
                        +{dayClasses.length - 3} meer
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Day and Week View
        <div
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl overflow-hidden"
          style={{
            position: 'relative',
            '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            '--border-radius-before': '24px',
          } as React.CSSProperties}
        >
          {/* Day headers with room sub-headers */}
          <div className={`grid border-b border-white/5 ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {viewDates.map((date, i) => {
              const dayOfWeek = date.getDay()
              return (
                <div
                  key={i}
                  className={`border-r border-white/5 last:border-r-0 ${
                    isToday(date) ? 'bg-amber-500/10' : ''
                  }`}
                >
                  {/* Day name and date */}
                  <div className="p-3 text-center border-b border-white/5">
                    <span className={`text-[14px] font-medium ${isToday(date) ? 'text-amber-400' : 'text-neutral-300'}`}>
                      {viewMode === 'day' ? (
                        `${DAYS[dayOfWeek]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
                      ) : (
                        <>
                          <span className="hidden md:inline">{DAYS[dayOfWeek]}</span>
                          <span className="md:hidden">{DAYS_SHORT[dayOfWeek]}</span>
                          <span className="ml-1 text-neutral-500">{date.getDate()}</span>
                        </>
                      )}
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
              )
            })}
          </div>

          {/* Classes grid with split columns */}
          <div className={`grid min-h-[500px] ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {viewDates.map((date, idx) => {
              const dayOfWeek = date.getDay()
              return (
                <div
                  key={idx}
                  className={`border-r border-white/5 last:border-r-0 ${
                    isToday(date) ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {!filterRoom && rooms && rooms.length > 0 ? (
                    // Split view: show both rooms
                    <div className="grid grid-cols-2 h-full">
                      {rooms.map((room, roomIdx) => {
                        const zoneId = `${idx}-${room.id}`
                        return (
                          <DropZone
                            key={room.id}
                            zoneId={zoneId}
                            dayIndex={dayOfWeek}
                            roomId={room.id}
                            isOver={dragOverZone === zoneId}
                            onDragOver={() => setDragOverZone(zoneId)}
                            onDragLeave={() => setDragOverZone(null)}
                            onDrop={handleDrop}
                            className={`p-1.5 space-y-1.5 min-h-[100px] ${roomIdx === 0 ? 'border-r border-white/5' : ''}`}
                          >
                            {getClassesForDayAndRoom(date, room.id).map((cls) => (
                              <DraggableClassCard
                                key={cls.id}
                                cls={cls as ClassWithRelations}
                                compact={viewMode === 'week'}
                                selectionMode={selectionMode}
                                isSelected={selectedClasses.has(cls.id)}
                                onClick={() => setEditingClass(cls as ClassWithRelations)}
                                onToggleSelect={() => toggleClassSelection(cls.id)}
                              />
                            ))}
                            {/* Show unassigned classes in first column */}
                            {roomIdx === 0 && getClassesForDayAndRoom(date, null).map((cls) => (
                              <DraggableClassCard
                                key={cls.id}
                                cls={cls as ClassWithRelations}
                                compact={viewMode === 'week'}
                                unassigned
                                selectionMode={selectionMode}
                                isSelected={selectedClasses.has(cls.id)}
                                onClick={() => setEditingClass(cls as ClassWithRelations)}
                                onToggleSelect={() => toggleClassSelection(cls.id)}
                              />
                            ))}
                          </DropZone>
                        )
                      })}
                    </div>
                  ) : (
                    // Single room view or no rooms
                    (() => {
                      const zoneId = `${idx}-${filterRoom || 'all'}`
                      return (
                        <DropZone
                          zoneId={zoneId}
                          dayIndex={dayOfWeek}
                          roomId={filterRoom}
                          isOver={dragOverZone === zoneId}
                          onDragOver={() => setDragOverZone(zoneId)}
                          onDragLeave={() => setDragOverZone(null)}
                          onDrop={handleDrop}
                          className="p-2 space-y-2 min-h-[100px]"
                        >
                          {(filterRoom
                            ? getClassesForDayAndRoom(date, filterRoom)
                            : getClassesForDate(date)
                          ).map((cls) => (
                            <DraggableClassCard
                              key={cls.id}
                              cls={cls as ClassWithRelations}
                              compact={viewMode === 'week'}
                              selectionMode={selectionMode}
                              isSelected={selectedClasses.has(cls.id)}
                              onClick={() => setEditingClass(cls as ClassWithRelations)}
                              onToggleSelect={() => toggleClassSelection(cls.id)}
                            />
                          ))}
                        </DropZone>
                      )
                    })()
                  )}
                </div>
              )
            })}
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
  selectionMode = false,
  isSelected = false,
  onClick,
  onToggleSelect,
}: {
  cls: ClassWithRelations
  compact?: boolean
  unassigned?: boolean
  selectionMode?: boolean
  isSelected?: boolean
  onClick: () => void
  onToggleSelect?: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    if (selectionMode) {
      e.preventDefault()
      return
    }
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

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect()
    } else {
      onClick()
    }
  }

  return (
    <div
      draggable={!selectionMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`rounded-xl transition select-none relative ${
        selectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      } ${compact ? 'p-2' : 'p-3'} ${
        unassigned ? 'opacity-60 border border-dashed border-neutral-600' : ''
      } ${isDragging ? 'opacity-50 ring-2 ring-amber-400' : ''} ${
        isSelected ? 'ring-2 ring-amber-400' : 'hover:ring-1 hover:ring-white/20'
      }`}
      style={{ backgroundColor: `${cls.disciplines?.color || '#3B82F6'}20` }}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-1 right-1">
          {isSelected ? (
            <CheckSquare size={14} className="text-amber-400" />
          ) : (
            <Square size={14} className="text-neutral-500" />
          )}
        </div>
      )}
      <p
        className={`font-medium truncate ${compact ? 'text-[10px] pr-4' : 'text-[12px]'}`}
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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

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
      start_date: startDate,
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
      setStartDate(new Date().toISOString().split('T')[0])
      onClose()
    }

    if (isRecurring && recurrenceEndDate) {
      createRecurringClass(
        { classData, recurrenceEndDate },
        { onSuccess: resetForm }
      )
    } else {
      // Voor een éénmalige class: bereken de eerste datum die overeenkomt met day_of_week
      // vanaf de geselecteerde startDate
      const selectedDate = new Date(startDate)
      const targetDayOfWeek = dayOfWeek

      // Vind de eerste dag die overeenkomt met de geselecteerde dag van de week
      while (selectedDate.getDay() !== targetDayOfWeek) {
        selectedDate.setDate(selectedDate.getDate() + 1)
      }

      const actualStartDate = selectedDate.toISOString().split('T')[0]

      // Zet zowel start_date als recurrence_end_date op dezelfde datum
      // zodat de class alleen op die ene datum verschijnt
      createClass(
        {
          ...classData,
          start_date: actualStartDate,
          recurrence_end_date: actualStartDate
        },
        { onSuccess: resetForm }
      )
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

        {/* Date range */}
        <div className="p-4 bg-white/5 rounded-xl space-y-4">
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Startdatum *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Vanaf deze datum is de les zichtbaar in het rooster
            </p>
          </div>

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
