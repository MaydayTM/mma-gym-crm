import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  CreditCard,
  Calendar,
  CheckSquare,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leden', href: '/members', icon: Users },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Abonnementen', href: '/subscriptions', icon: CreditCard },
  { name: 'Rooster', href: '/schedule', icon: Calendar },
  { name: 'Taken', href: '/tasks', icon: CheckSquare, badge: 12 },
  { name: 'Instellingen', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { signOut, member, user } = useAuth()

  const displayName = member
    ? `${member.first_name} ${member.last_name}`
    : user?.email?.split('@')[0] || 'Gebruiker'

  return (
    <aside className="w-64 bg-neutral-950 border-r border-white/10 min-h-screen flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-[20px] font-semibold text-neutral-50 tracking-tight">RCN</h1>
        <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mt-1">Reconnect Academy</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-white/10 to-white/0 text-amber-300 border border-white/10'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-50 border border-transparent'
                  }`
                }
              >
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[14px] font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-amber-300 text-neutral-950 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-50 truncate">{displayName}</p>
            <p className="text-xs text-neutral-500 truncate">{member?.role || 'member'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-neutral-400 hover:bg-white/5 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[14px] font-medium">Uitloggen</span>
        </button>
      </div>

      {/* Footer with live indicator */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"></span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">v0.1.0 MVP</span>
        </div>
      </div>
    </aside>
  )
}
