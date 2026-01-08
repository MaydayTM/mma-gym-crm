import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Mic,
  MicOff,
  Mail,
  FileText,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Phone,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  ChevronRight,
  MessageSquare,
  Zap
} from 'lucide-react'
import { useAIChat, SUGGESTED_QUESTIONS } from '../hooks/useAIChat'

// SpeechRecognition types for browser compatibility
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

const KITANA_AVATAR = '/images/rcn_assistent.png'

// Agent capabilities/functions
const AGENT_FUNCTIONS = [
  {
    id: 'email',
    title: 'Email Versturen',
    description: 'Laat Kitana een professionele email opstellen en versturen naar een lid',
    icon: Mail,
    color: 'amber',
    status: 'active' as const,
    prompt: 'Stel een email op voor',
  },
  {
    id: 'report',
    title: 'Rapport Genereren',
    description: 'Maak een overzichtelijk rapport voor je volgende clubmeeting',
    icon: FileText,
    color: 'sky',
    status: 'active' as const,
    prompt: 'Maak een rapport van',
  },
  {
    id: 'financial',
    title: 'Financieel Overzicht',
    description: 'Genereer een financieel verslag met omzet en trends',
    icon: TrendingUp,
    color: 'emerald',
    status: 'coming_soon' as const,
    prompt: 'Geef me een financieel overzicht van',
  },
  {
    id: 'churn',
    title: 'Churn Analyse',
    description: 'Ontdek welke leden risico lopen om op te zeggen',
    icon: AlertTriangle,
    color: 'rose',
    status: 'active' as const,
    prompt: 'Welke leden hebben churn risico?',
  },
  {
    id: 'leaderboard',
    title: 'Training Rankings',
    description: 'Bekijk wie het meest heeft getraind deze periode',
    icon: Trophy,
    color: 'purple',
    status: 'active' as const,
    prompt: 'Wie heeft het meest getraind deze maand?',
  },
  {
    id: 'followup',
    title: 'Lead Follow-up',
    description: 'Krijg een overzicht van leads die aandacht nodig hebben',
    icon: Phone,
    color: 'orange',
    status: 'active' as const,
    prompt: 'Welke leads moeten opgevolgd worden?',
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
}

export function KitanaHub() {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const {
    messages,
    sendMessage,
    isSending,
    startNewConversation,
  } = useAIChat()

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'nl-NL'

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setMessage(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Spraakherkenning wordt niet ondersteund in deze browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      setShowChat(true)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    const userMessage = message.trim()
    setMessage('')
    setShowChat(true)

    try {
      await sendMessage(userMessage)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleFunctionClick = (func: typeof AGENT_FUNCTIONS[0]) => {
    if (func.status === 'coming_soon') return
    setMessage(func.prompt)
    setShowChat(true)
    inputRef.current?.focus()
  }

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question)
    setShowChat(true)
    inputRef.current?.focus()
  }

  // Text-to-speech for Kitana responses
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'nl-NL'
      utterance.rate = 1
      utterance.pitch = 1.1 // Slightly higher pitch for feminine voice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Hero Section - Kitana Avatar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 border border-white/5">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Section */}
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 blur-xl opacity-30 animate-pulse" />

              {/* Avatar container with animated border */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-[3px] animate-spin-slow">
                  <div className="w-full h-full rounded-full bg-neutral-900" />
                </div>

                {/* Main avatar */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-amber-500/50 shadow-2xl shadow-amber-500/20">
                  <img
                    src={KITANA_AVATAR}
                    alt="Kitana AI"
                    className="w-full h-full object-cover"
                  />

                  {/* Status indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                    <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Kitana</h1>
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={12} />
                    AI Assistant
                  </span>
                </span>
              </div>

              <p className="text-neutral-400 text-lg mb-6 max-w-xl">
                Jouw slimme assistent voor Reconnect Academy. Stel vragen, genereer rapporten,
                verstuur emails en krijg inzichten — allemaal via natuurlijke conversatie.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                  <MessageSquare size={16} className="text-amber-400" />
                  <span className="text-sm text-neutral-300">{messages.length} berichten</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                  <Zap size={16} className="text-amber-400" />
                  <span className="text-sm text-neutral-300">6 functies actief</span>
                </div>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={toggleListening}
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <span className="text-xs text-neutral-500">
                {isListening ? 'Luisteren...' : 'Spreek'}
              </span>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  <VolumeX size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Chat Input Section */}
          <div className="mt-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Vraag Kitana iets... bijv. 'Wie heeft het meest getraind?'"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-[15px] pr-14"
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white'
                      : 'text-neutral-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-amber-500/50 disabled:to-orange-500/50 text-neutral-900 font-semibold rounded-2xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:shadow-none flex items-center gap-2"
              >
                {isSending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                <span className="hidden sm:inline">Verstuur</span>
              </button>
            </div>

            {/* Suggested Questions */}
            {!showChat && (
              <div className="flex flex-wrap gap-2 mt-4">
                {SUGGESTED_QUESTIONS.map((sq) => (
                  <button
                    key={sq.question}
                    onClick={() => handleSuggestedQuestion(sq.question)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-sm text-neutral-300 hover:text-white transition-all"
                  >
                    <span>{sq.icon}</span>
                    <span>{sq.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Section (Expandable) */}
      {showChat && messages.length > 0 && (
        <div className="rounded-2xl bg-neutral-900/50 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-medium text-neutral-300">Conversatie</h3>
            <button
              onClick={() => {
                startNewConversation()
                setShowChat(false)
              }}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Nieuwe conversatie
            </button>
          </div>

          <div
            ref={chatContainerRef}
            className="max-h-96 overflow-y-auto p-5 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <img
                    src={KITANA_AVATAR}
                    alt="Kitana"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-amber-500/20 text-amber-100'
                      : 'bg-white/5 text-neutral-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakResponse(msg.content)}
                      className="mt-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-amber-400 transition-colors"
                      title="Laat Kitana dit voorlezen"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3">
                <img
                  src={KITANA_AVATAR}
                  alt="Kitana"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="px-4 py-3 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-amber-400" />
                    <span className="text-sm text-neutral-400">Kitana denkt na...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Functions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Smart Functies</h2>
          <span className="text-xs text-neutral-500">Klik om te starten</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_FUNCTIONS.map((func) => {
            const colors = colorClasses[func.color]
            const isComingSoon = func.status === 'coming_soon'

            return (
              <button
                key={func.id}
                onClick={() => handleFunctionClick(func)}
                disabled={isComingSoon}
                className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 ${
                  isComingSoon
                    ? 'bg-neutral-900/30 border-neutral-800/50 cursor-not-allowed opacity-60'
                    : `bg-neutral-900 border-neutral-800 hover:border-${func.color}-500/50 hover:shadow-lg ${colors.glow}`
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <func.icon className={colors.text} size={24} />
                </div>

                {/* Content */}
                <h3 className={`text-lg font-medium mb-1 transition-colors ${
                  isComingSoon ? 'text-neutral-500' : 'text-white group-hover:text-amber-300'
                }`}>
                  {func.title}
                </h3>
                <p className="text-sm text-neutral-500 mb-3">{func.description}</p>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  {isComingSoon ? (
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-neutral-800 text-neutral-500 rounded">
                      Binnenkort
                    </span>
                  ) : (
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider ${colors.bg} ${colors.text} rounded`}>
                      Actief
                    </span>
                  )}

                  {!isComingSoon && (
                    <ChevronRight
                      size={18}
                      className="text-neutral-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Future: Premium Avatar Section Placeholder */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/5 to-amber-500/5 border border-purple-500/20 p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="text-purple-400" size={28} />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Interactieve Avatar (Premium)</h3>
        <p className="text-sm text-neutral-400 max-w-md mx-auto mb-4">
          Binnenkort: Praat face-to-face met Kitana via een realistische AI-avatar
          die reageert met spraak en expressies.
        </p>
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          In ontwikkeling
        </span>
      </div>
    </div>
  )
}

export default KitanaHub
