import { useState, useEffect } from 'react'
import { DoorOpen, Loader2, Save, Clock, CalendarCheck, Building2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useAccessSettings, type AccessMode, type OpenGymHour, type AccessSettingsFormData } from '../../hooks/useAccessSettings'

const DAY_NAMES = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

const ACCESS_MODES: { value: AccessMode; label: string; description: string; icon: typeof DoorOpen }[] = [
  {
    value: 'subscription_only',
    label: 'Alleen Abonnement',
    description: 'Elk actief abonnement geeft toegang. Geen reservering nodig.',
    icon: DoorOpen,
  },
  {
    value: 'reservation_required',
    label: 'Reservering Vereist',
    description: 'Lid moet een reservering hebben voor een les binnen het tijdvenster.',
    icon: CalendarCheck,
  },
  {
    value: 'open_gym',
    label: 'Open Gym Uren',
    description: 'Toegang alleen tijdens ingestelde openingstijden (abonnement vereist).',
    icon: Building2,
  },
]

const DEFAULT_HOURS: OpenGymHour[] = [
  { day: 1, open: '08:00', close: '22:00' },
  { day: 2, open: '08:00', close: '22:00' },
  { day: 3, open: '08:00', close: '22:00' },
  { day: 4, open: '08:00', close: '22:00' },
  { day: 5, open: '08:00', close: '22:00' },
  { day: 6, open: '09:00', close: '18:00' },
  { day: 0, open: '09:00', close: '14:00' },
]

export function AccessSettings() {
  const { settings, isLoading, saveSettings, isSaving, saveError } = useAccessSettings()
  const [saved, setSaved] = useState(false)

  const [accessMode, setAccessMode] = useState<AccessMode>('subscription_only')
  const [minutesBefore, setMinutesBefore] = useState(30)
  const [gracePeriod, setGracePeriod] = useState(10)
  const [openGymHours, setOpenGymHours] = useState<OpenGymHour[]>(DEFAULT_HOURS)

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setAccessMode(settings.access_mode as AccessMode)
      setMinutesBefore(settings.minutes_before_class)
      setGracePeriod(settings.grace_period_minutes)
      if (Array.isArray(settings.open_gym_hours) && settings.open_gym_hours.length > 0) {
        setOpenGymHours(settings.open_gym_hours)
      }
    }
  }, [settings])

  const handleSave = async () => {
    const formData: AccessSettingsFormData = {
      access_mode: accessMode,
      minutes_before_class: minutesBefore,
      grace_period_minutes: gracePeriod,
      open_gym_hours: openGymHours,
    }

    await saveSettings(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateHour = (day: number, field: 'open' | 'close', value: string) => {
    setOpenGymHours(prev =>
      prev.map(h => h.day === day ? { ...h, [field]: value } : h)
    )
  }

  const toggleDay = (day: number) => {
    setOpenGymHours(prev => {
      const exists = prev.find(h => h.day === day)
      if (exists) {
        return prev.filter(h => h.day !== day)
      }
      return [...prev, { day, open: '09:00', close: '21:00' }].sort((a, b) => a.day - b.day)
    })
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
          <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center">
            <DoorOpen className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Deur Toegang</h2>
            <p className="text-sm text-neutral-400">Configureer wanneer leden de gym kunnen betreden</p>
          </div>
        </div>

        {/* Team bypass info */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6">
          <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-purple-300/80">
            <strong className="text-purple-300">Team leden</strong> (admin, medewerker, coordinator, coach) hebben altijd
            toegang, ongeacht de instellingen hieronder.
          </p>
        </div>

        {/* Access Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Toegangsmodus</h3>
          <div className="space-y-2">
            {ACCESS_MODES.map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setAccessMode(mode.value)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border transition text-left ${
                    accessMode === mode.value
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    accessMode === mode.value ? 'bg-amber-500/20' : 'bg-neutral-800'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      accessMode === mode.value ? 'text-amber-300' : 'text-neutral-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        accessMode === mode.value ? 'text-amber-300' : 'text-neutral-200'
                      }`}>
                        {mode.label}
                      </span>
                      {accessMode === mode.value && (
                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded">
                          Actief
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{mode.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reservation Time Windows - only show when reservation_required */}
      {accessMode === 'reservation_required' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-400/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Tijdvenster</h3>
              <p className="text-xs text-neutral-500">Hoeveel tijd voor en na de les mag een lid binnen?</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Minuten voor de les
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minutesBefore}
                  onChange={(e) => setMinutesBefore(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={120}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                />
                <span className="text-sm text-neutral-500 whitespace-nowrap">min</span>
              </div>
              <p className="text-[11px] text-neutral-600 mt-1">Lid kan {minutesBefore} min voor de les naar binnen</p>
            </div>

            <div>
              <label className="block text-[12px] text-neutral-500 uppercase tracking-wide mb-2">
                Grace period na start
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={60}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-[14px] text-neutral-100 focus:outline-none focus:border-amber-300/70"
                />
                <span className="text-sm text-neutral-500 whitespace-nowrap">min</span>
              </div>
              <p className="text-[11px] text-neutral-600 mt-1">Tot {gracePeriod} min na de start nog binnen</p>
            </div>
          </div>

          {/* Example */}
          <div className="p-3 bg-neutral-800/50 rounded-xl">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wide mb-1">Voorbeeld</p>
            <p className="text-sm text-neutral-300">
              Les om <strong className="text-white">19:00</strong> → deur open vanaf{' '}
              <strong className="text-green-400">
                {formatTime(subtractMinutes('19:00', minutesBefore))}
              </strong>{' '}
              tot{' '}
              <strong className="text-amber-300">
                {formatTime(addMinutes('19:00', gracePeriod))}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Open Gym Hours - only show when open_gym */}
      {accessMode === 'open_gym' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Openingstijden</h3>
              <p className="text-xs text-neutral-500">Op welke dagen en tijden is de gym open?</p>
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const hour = openGymHours.find(h => h.day === day)
              const isActive = !!hour

              return (
                <div
                  key={day}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    isActive
                      ? 'bg-neutral-900 border-neutral-800'
                      : 'bg-neutral-900/50 border-neutral-800/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-neutral-600 hover:border-neutral-500'
                    }`}
                  >
                    {isActive && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span className={`text-sm w-24 ${isActive ? 'text-white font-medium' : 'text-neutral-500'}`}>
                    {DAY_NAMES[day]}
                  </span>

                  {isActive && hour ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={hour.open}
                        onChange={(e) => updateHour(day, 'open', e.target.value)}
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-300/70"
                      />
                      <span className="text-neutral-600">—</span>
                      <input
                        type="time"
                        value={hour.close}
                        onChange={(e) => updateHour(day, 'close', e.target.value)}
                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-300/70"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-600">Gesloten</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save Button & Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-neutral-950 px-6 py-3 text-[15px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Opslaan
        </button>

        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <CheckCircle size={16} />
            Opgeslagen
          </span>
        )}

        {saveError && (
          <span className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle size={16} />
            {saveError.message}
          </span>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4">
        <p className="text-sm text-cyan-300/80">
          <strong className="text-cyan-300">Hoe werkt het?</strong> De deur (ESP32 + QR scanner) controleert bij
          elk scan of het lid mag binnenkomen op basis van deze regels. Team leden (coaches, admins) hebben
          altijd toegang. Fighters moeten aan de actieve modus voldoen.
        </p>
      </div>
    </div>
  )
}

// Helper: subtract minutes from HH:MM time string
function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m - minutes
  const newH = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60)
  const newM = ((totalMin % 60) + 60) % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Helper: add minutes to HH:MM time string
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m + minutes
  const newH = Math.floor(totalMin / 60) % 24
  const newM = totalMin % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Format time for display
function formatTime(time: string): string {
  return time
}
