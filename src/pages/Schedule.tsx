import { useState } from 'react'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { Modal } from '../components/ui'
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '../hooks/useClasses'
import { useDisciplines } from '../hooks/useDisciplines'
import { useMembers } from '../hooks/useMembers'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

type ClassWithRelations = {
  id: string
  name: string
  discipline_id: string
  coach_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number | null
  room: string | null
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
}

export function Schedule() {
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(null)
  const { data: classes, isLoading } = useClasses()

  // Group classes by day
  const classesByDay = DAYS.map((_, dayIndex) =>
    classes?.filter((c) => c.day_of_week === dayIndex) || []
  )

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Rooster</h1>
          <p className="text-[14px] text-neutral-400 mt-1">Lesrooster en planning</p>
        </div>
        <button
          onClick={() => setIsNewClassModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium shadow-[0_20px_45px_rgba(251,191,36,0.7)] hover:bg-amber-200 transition"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span>Nieuwe Les</span>
        </button>
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
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-4 text-center border-r border-white/5 last:border-r-0 ${
                  i === new Date().getDay() ? 'bg-amber-500/10' : ''
                }`}
              >
                <span className="hidden md:inline text-[14px] font-medium text-neutral-300">
                  {day}
                </span>
                <span className="md:hidden text-[14px] font-medium text-neutral-300">
                  {DAYS_SHORT[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Classes grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {classesByDay.map((dayClasses, dayIndex) => (
              <div
                key={dayIndex}
                className={`border-r border-white/5 last:border-r-0 p-2 space-y-2 ${
                  dayIndex === new Date().getDay() ? 'bg-amber-500/5' : ''
                }`}
              >
                {dayClasses
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setEditingClass(cls as ClassWithRelations)}
                      className="p-3 rounded-xl cursor-pointer hover:ring-1 hover:ring-white/20 transition"
                      style={{ backgroundColor: `${cls.disciplines?.color || '#3B82F6'}20` }}
                    >
                      <p
                        className="text-[12px] font-medium truncate"
                        style={{ color: cls.disciplines?.color || '#3B82F6' }}
                      >
                        {cls.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                      </p>
                      {cls.coach && (
                        <p className="text-[10px] text-neutral-500 mt-1 truncate">
                          {cls.coach.first_name} {cls.coach.last_name}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
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

function NewClassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('20:00')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [room, setRoom] = useState('')

  const { data: disciplines } = useDisciplines()
  const { data: coaches } = useMembers({ role: 'coach' })
  const { mutate: createClass, isPending } = useCreateClass()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createClass(
      {
        name,
        discipline_id: disciplineId,
        coach_id: coachId || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
        room: room || null,
      },
      {
        onSuccess: () => {
          // Reset form
          setName('')
          setDisciplineId('')
          setCoachId('')
          setDayOfWeek(1)
          setStartTime('19:00')
          setEndTime('20:00')
          setMaxCapacity('')
          setRoom('')
          onClose()
        },
      }
    )
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

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
              Zaal
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Zaal 1"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
            />
          </div>
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
            disabled={isPending || !name || !disciplineId}
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? 'Opslaan...' : 'Aanmaken'}
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
  const [dayOfWeek, setDayOfWeek] = useState(classData.day_of_week)
  const [startTime, setStartTime] = useState(classData.start_time.slice(0, 5))
  const [endTime, setEndTime] = useState(classData.end_time.slice(0, 5))
  const [maxCapacity, setMaxCapacity] = useState(classData.max_capacity?.toString() || '')
  const [room, setRoom] = useState(classData.room || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: disciplines } = useDisciplines()
  const { data: coaches } = useMembers({ role: 'coach' })
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
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
        room: room || null,
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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Zaal
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Zaal 1"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-300/70"
              />
            </div>
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
