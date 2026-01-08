// Kitana avatar
const KITANA_AVATAR = '/images/rcn_assistent.png'

interface AIFloatingButtonProps {
  onClick: () => void
}

export function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 pl-1 pr-4 py-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
      aria-label="Vraag Kitana"
    >
      <img
        src={KITANA_AVATAR}
        alt="Kitana"
        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
      />
      <span className="font-medium">Vraag Kitana</span>
    </button>
  )
}
