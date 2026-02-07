import { useState, useMemo } from 'react'
import { Loader2, ChevronLeft, ChevronRight, Users, Clock, MapPin, Check, X } from 'lucide-react'
import { useClasses } from '../hooks/useClasses'
import { useClassReservations, useCreateReservation, useCancelReservation, useCheckInReservation } from '../hooks/useReservations'
import { useMembers } from '../hooks/useMembers'
import { Modal } from '../components/ui'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

// Helper om weekdagen te genereren
function getWeekDays(date: Date): Date[] {
  const week: Date[] = []
  const start = new Date(date)
  // Ga naar maandag van deze week
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    week.push(d)
  }
  return week
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
}

export function Reservations() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState<{
    classId: string
    date: string
    className: string
    disciplineColor: string
    startTime: string
    endTime: string
    maxCapacity: number | null
    room: string | null
  } | null>(null)

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const { data: classes, isLoading } = useClasses()

  // Filter classes voor geselecteerde dag
  const selectedDayClasses = useMemo(() => {
    if (!classes) return []
    const dayOfWeek = selectedDate.getDay()
    return classes.filter((c) => c.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [classes, selectedDate])

  const goToPrevWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-neutral-50 tracking-tight">Reservaties</h1>
          <p className="text-[14px] text-neutral-400 mt-1">
            Bekijk en beheer les-inschrijvingen
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div
        className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-4"
        style={{
          position: 'relative',
          '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
          '--border-radius-before': '24px',
        } as React.CSSProperties}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevWeek}
            className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400 hover:text-neutral-200"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-[16px] font-medium text-neutral-100">
              {weekDays[0]?.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={goToToday}
              className="text-[13px] text-amber-300 hover:text-amber-200 transition px-3 py-1 rounded-lg hover:bg-amber-500/10"
            >
              Vandaag
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400 hover:text-neutral-200"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const isToday = formatDate(day) === formatDate(new Date())
            const isSelected = formatDate(day) === formatDate(selectedDate)
            const dayClasses = classes?.filter((c) => c.day_of_week === day.getDay()) || []

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-xl text-center transition ${
                  isSelected
                    ? 'bg-amber-300 text-neutral-950'
                    : isToday
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide mb-1">
                  {DAYS[day.getDay()].slice(0, 2)}
                </p>
                <p className="text-[18px] font-medium">
                  {day.getDate()}
                </p>
                {dayClasses.length > 0 && (
                  <p className={`text-[11px] mt-1 ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {dayClasses.length} {dayClasses.length === 1 ? 'les' : 'lessen'}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Classes for selected day */}
      <div className="space-y-3">
        <h2 className="text-[16px] font-medium text-neutral-200">
          {DAYS[selectedDate.getDay()]} {formatDisplayDate(selectedDate)}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-neutral-500" size={32} />
          </div>
        ) : selectedDayClasses.length > 0 ? (
          <div className="space-y-3">
            {selectedDayClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                date={formatDate(selectedDate)}
                onClick={() => setSelectedClass({
                  classId: cls.id,
                  date: formatDate(selectedDate),
                  className: cls.name,
                  disciplineColor: cls.disciplines?.color || '#3B82F6',
                  startTime: cls.start_time,
                  endTime: cls.end_time,
                  maxCapacity: cls.max_capacity,
                  room: cls.room,
                })}
              />
            ))}
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
            <p className="text-[14px] text-neutral-500">
              Geen lessen gepland op deze dag
            </p>
          </div>
        )}
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <ClassDetailModal
          classId={selectedClass.classId}
          date={selectedClass.date}
          className={selectedClass.className}
          disciplineColor={selectedClass.disciplineColor}
          startTime={selectedClass.startTime}
          endTime={selectedClass.endTime}
          maxCapacity={selectedClass.maxCapacity}
          room={selectedClass.room}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  )
}

function ClassCard({
  classData,
  date,
  onClick,
}: {
  classData: {
    id: string
    name: string
    start_time: string
    end_time: string
    max_capacity: number | null
    room: string | null
    disciplines: { name: string; color: string } | null
    coach: { first_name: string; last_name: string } | null
  }
  date: string
  onClick: () => void
}) {
  const { data: reservations } = useClassReservations(classData.id, date)
  const reservationCount = reservations?.length || 0
  const isFull = classData.max_capacity ? reservationCount >= classData.max_capacity : false

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-5 text-left hover:from-white/10 transition"
      style={{
        position: 'relative',
        '--border-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        '--border-radius-before': '16px',
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: classData.disciplines?.color || '#3B82F6' }}
            />
            <span
              className="text-[13px] font-medium"
              style={{ color: classData.disciplines?.color || '#3B82F6' }}
            >
              {classData.disciplines?.name}
            </span>
          </div>
          <h3 className="text-[16px] font-medium text-neutral-50 mb-1">
            {classData.name}
          </h3>
          <div className="flex items-center gap-4 text-[13px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} strokeWidth={1.5} />
              {classData.start_time.slice(0, 5)} - {classData.end_time.slice(0, 5)}
            </span>
            {classData.room && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} strokeWidth={1.5} />
                {classData.room}
              </span>
            )}
            {classData.coach && (
              <span>
                {classData.coach.first_name} {classData.coach.last_name}
              </span>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
          isFull ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-neutral-300'
        }`}>
          <Users size={14} strokeWidth={1.5} />
          <span className="text-[13px]">
            {reservationCount}
            {classData.max_capacity && `/${classData.max_capacity}`}
          </span>
        </div>
      </div>
    </button>
  )
}

function ClassDetailModal({
  classId,
  date,
  className,
  disciplineColor,
  startTime,
  endTime,
  maxCapacity,
  room,
  onClose,
}: {
  classId: string
  date: string
  className: string
  disciplineColor: string
  startTime: string
  endTime: string
  maxCapacity: number | null
  room: string | null
  onClose: () => void
}) {
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [reservationError, setReservationError] = useState<string | null>(null)

  const { data: reservations, isLoading } = useClassReservations(classId, date)
  const { data: members } = useMembers({ status: 'active' })
  const { mutate: createReservation, isPending: isCreating } = useCreateReservation()
  const { mutate: cancelReservation, isPending: isCancelling } = useCancelReservation()
  const { mutate: checkInReservation, isPending: isCheckingIn } = useCheckInReservation()

  // Filter members die nog geen reservatie hebben
  const availableMembers = members?.filter(
    (m) => !reservations?.some((r) => r.member_id === m.id)
  ) || []

  const handleAddMember = () => {
    if (!selectedMemberId) return
    setReservationError(null)

    createReservation(
      {
        member_id: selectedMemberId,
        class_id: classId,
        reservation_date: date,
      },
      {
        onSuccess: () => {
          setSelectedMemberId('')
          setShowAddMember(false)
        },
        onError: (error) => {
          setReservationError(error.message)
        },
      }
    )
  }

  const handleCancel = (reservationId: string) => {
    if (confirm('Weet je zeker dat je deze reservatie wilt annuleren?')) {
      cancelReservation(reservationId)
    }
  }

  const handleCheckIn = (reservationId: string) => {
    checkInReservation(reservationId)
  }

  const reservationCount = reservations?.length || 0
  const isFull = maxCapacity ? reservationCount >= maxCapacity : false

  return (
    <Modal isOpen={true} onClose={onClose} title={className} size="lg">
      <div className="space-y-6">
        {/* Class info */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: disciplineColor }}
            />
            <div className="text-[14px] text-neutral-300">
              <span className="flex items-center gap-2">
                <Clock size={14} strokeWidth={1.5} />
                {startTime.slice(0, 5)} - {endTime.slice(0, 5)}
              </span>
            </div>
            {room && (
              <div className="text-[14px] text-neutral-500 flex items-center gap-2">
                <MapPin size={14} strokeWidth={1.5} />
                {room}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isFull ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-neutral-300'
          }`}>
            <Users size={14} strokeWidth={1.5} />
            <span className="text-[13px]">
              {reservationCount}
              {maxCapacity && `/${maxCapacity}`}
            </span>
          </div>
        </div>

        {/* Add member section */}
        {!isFull && (
          <div>
            {showAddMember ? (
              <div className="space-y-2">
                <div className="flex gap-3">
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                  >
                    <option value="">Selecteer lid...</option>
                    {availableMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedMemberId || isCreating}
                    className="px-4 py-2 bg-amber-300 text-neutral-950 rounded-xl font-medium hover:bg-amber-200 transition disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Toevoegen'}
                  </button>
                  <button
                    onClick={() => { setShowAddMember(false); setReservationError(null) }}
                    className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition"
                  >
                    Annuleren
                  </button>
                </div>
                {reservationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <p className="text-[13px] text-rose-400">{reservationError}</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="text-[14px] text-amber-300 hover:text-amber-200 transition"
              >
                + Lid toevoegen aan les
              </button>
            )}
          </div>
        )}

        {/* Reservations list */}
        <div>
          <h3 className="text-[14px] font-medium text-neutral-200 mb-3">
            Inschrijvingen ({reservationCount})
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-neutral-500" size={24} />
            </div>
          ) : reservations && reservations.length > 0 ? (
            <div className="space-y-2">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {reservation.member?.profile_picture_url ? (
                      <img
                        src={reservation.member.profile_picture_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[12px] font-medium text-neutral-400">
                        {reservation.member?.first_name?.charAt(0)}
                        {reservation.member?.last_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-[14px] text-neutral-100">
                        {reservation.member?.first_name} {reservation.member?.last_name}
                      </p>
                      <p className="text-[11px] text-neutral-500 capitalize">
                        {reservation.status === 'checked_in' ? 'Ingecheckt' : 'Gereserveerd'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {reservation.status === 'reserved' && (
                      <>
                        <button
                          onClick={() => handleCheckIn(reservation.id)}
                          disabled={isCheckingIn}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                          title="Check-in"
                        >
                          <Check size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          disabled={isCancelling}
                          className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition"
                          title="Annuleren"
                        >
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                    {reservation.status === 'checked_in' && (
                      <span className="flex items-center gap-1 text-[12px] text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                        <Check size={14} strokeWidth={1.5} />
                        Aanwezig
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-neutral-500 text-center py-8">
              Nog geen inschrijvingen voor deze les
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
