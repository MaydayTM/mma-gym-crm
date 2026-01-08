import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AIFloatingButton } from '../ai/AIFloatingButton'
import { AIChatPanel } from '../ai/AIChatPanel'

export function Layout() {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>

      {/* AI Assistant */}
      <AIFloatingButton onClick={() => setIsAIChatOpen(true)} />
      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  )
}
