import { useState, useRef, useEffect, type FormEvent } from 'react'
import { X, Send, Plus, Trash2, MessageSquare, Sparkles, Loader2 } from 'lucide-react'
import { useAIChat, SUGGESTED_QUESTIONS, type AIMessage } from '../../hooks/useAIChat'

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    activeConversationId,
    conversations,
    isLoadingConversations,
    messages,
    isLoadingMessages,
    sendMessage,
    isSending,
    startNewConversation,
    selectConversation,
    deleteConversation,
  } = useAIChat()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const question = input.trim()
    setInput('')

    try {
      await sendMessage(question)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleSuggestedQuestion = async (question: string) => {
    if (isSending) return
    setInput('')

    try {
      await sendMessage(question)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-neutral-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-neutral-50">AI Assistent</h2>
              <p className="text-xs text-neutral-400">Stel een vraag over je gym</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-neutral-400 hover:text-neutral-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conversation List (collapsible) */}
        {conversations.length > 0 && (
          <div className="border-b border-white/10">
            <details className="group">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm text-neutral-400 hover:text-neutral-200">
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Eerdere gesprekken ({conversations.length})
                </span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="max-h-40 overflow-y-auto px-2 pb-2">
                <button
                  onClick={startNewConversation}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  <Plus size={16} />
                  Nieuw gesprek
                </button>
                {isLoadingConversations ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">Laden...</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-2 group ${
                        activeConversationId === conv.id
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      } rounded-lg transition-colors`}
                    >
                      <button
                        onClick={() => selectConversation(conv.id)}
                        className="flex-1 text-left px-3 py-2 text-sm text-neutral-300 truncate"
                      >
                        {conv.title || 'Nieuw gesprek'}
                      </button>
                      <button
                        onClick={() => deleteConversation(conv.id)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Show suggested questions when no messages */}
          {messages.length === 0 && !isLoadingMessages && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl mb-4">
                  <Sparkles size={32} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-50 mb-2">
                  Hoe kan ik helpen?
                </h3>
                <p className="text-sm text-neutral-400">
                  Stel een vraag over je leden, leads of gym statistieken
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wide px-1">
                  Suggesties
                </p>
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.question}
                    onClick={() => handleSuggestedQuestion(suggestion.question)}
                    disabled={isSending}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors disabled:opacity-50"
                  >
                    <span className="text-xl">{suggestion.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        {suggestion.label}
                      </p>
                      <p className="text-xs text-neutral-400">{suggestion.question}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading messages */}
          {isLoadingMessages && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-purple-400" />
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Sparkles size={16} className="text-purple-400" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Stel een vraag..."
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white transition-colors disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// Message bubble component
function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="p-2 bg-purple-500/20 rounded-xl flex-shrink-0">
          <Sparkles size={16} className="text-purple-400" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-purple-600 text-white rounded-tr-sm'
            : 'bg-white/5 text-neutral-200 rounded-tl-sm'
        }`}
      >
        {/* Render markdown-like content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {formatMessageContent(message.content)}
        </div>
      </div>
    </div>
  )
}

// Simple markdown-like formatting
function formatMessageContent(content: string) {
  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/)

  return paragraphs.map((paragraph, i) => {
    // Check if it's a list
    const lines = paragraph.split('\n')
    const isList = lines.every(
      (line) => line.trim().startsWith('- ') || line.trim().startsWith('• ') || /^\d+\./.test(line.trim())
    )

    if (isList) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1 my-2">
          {lines.map((line, j) => (
            <li key={j} className="text-sm">
              {line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}
            </li>
          ))}
        </ul>
      )
    }

    // Check if it's a header (starts with **)
    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
      return (
        <p key={i} className="font-semibold text-neutral-50 my-2">
          {paragraph.slice(2, -2)}
        </p>
      )
    }

    // Regular paragraph with inline bold
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/)
    return (
      <p key={i} className="my-2">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold text-neutral-50">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return part
        })}
      </p>
    )
  })
}
