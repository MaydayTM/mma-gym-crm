import { Sparkles } from 'lucide-react'

interface AIFloatingButtonProps {
  onClick: () => void
}

export function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
      aria-label="Open AI Assistent"
    >
      <Sparkles size={20} />
      <span className="font-medium">AI Assistent</span>
    </button>
  )
}
