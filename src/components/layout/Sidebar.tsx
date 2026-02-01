import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  CreditCard,
  Calendar,
  CalendarCheck,
  ScanLine,
  BarChart3,
  Sparkles,
  Shield,
  LogOut,
  ShoppingBag,
  Mail,
  ChevronDown,
  ExternalLink,
  Palette,
  Monitor,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useModules } from '../../hooks/useModules'
import { usePermissions } from '../../hooks/usePermissions'

const KITANA_AVATAR = '/images/rcn_assistent.png'

// Navigation item type
interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: number
  adminOnly?: boolean
  trialBadge?: number | null
  expiredBadge?: boolean
  disabled?: boolean
  external?: boolean
  permission?: keyof ReturnType<typeof usePermissions>  // Permission key from usePermissions
}

// Navigation group type
interface NavGroup {
  id: string
  name: string
  icon: LucideIcon
  items: NavItem[]
}

// Standalone items (no group)
const standaloneItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
]

// Grouped navigation
const navigationGroups: NavGroup[] = [
  {
    id: 'leden-sales',
    name: 'Leden & Sales',
    icon: Users,
    items: [
      { name: 'Leden', href: '/members', icon: Users },  // All authenticated
      { name: 'Leads', href: '/leads', icon: UserPlus, permission: 'canManageLeads' },  // Staff only
      { name: 'Abonnementen', href: '/subscriptions', icon: CreditCard, permission: 'canEditMembers' },  // Staff only
    ],
  },
  {
    id: 'planning',
    name: 'Planning',
    icon: Calendar,
    items: [
      { name: 'Rooster', href: '/schedule', icon: Calendar, permission: 'canViewSchedule' },  // Team + fighters
      { name: 'Reservaties', href: '/reservations', icon: CalendarCheck },  // All authenticated
      { name: 'Check-in', href: '/checkin', icon: ScanLine, permission: 'canCheckInMembers' },  // Staff only
    ],
  },
  {
    id: 'inzichten',
    name: 'Inzichten',
    icon: BarChart3,
    items: [
      { name: 'Rapportages', href: '/reports', icon: BarChart3, permission: 'canManageFinances' },  // Admin only
      { name: 'Taken', href: '/tasks', icon: Sparkles },  // All authenticated
    ],
  },
]

// Modules group (premium add-ons) - built dynamically
const modulesGroupBase: NavGroup = {
  id: 'modules',
  name: 'Modules',
  icon: ShoppingBag,
  items: [],
}

// Beheer group
const beheerGroup: NavGroup = {
  id: 'beheer',
  name: 'Beheer',
  icon: Settings,
  items: [
    { name: 'Team', href: '/team', icon: Shield, permission: 'isAdmin' },  // Admin only
    { name: 'Instellingen', href: '/settings', icon: Settings, permission: 'isStaff' },  // Staff only
  ],
}

// LocalStorage key for persisting open/closed state
const SIDEBAR_STATE_KEY = 'rcn-sidebar-groups'

export function Sidebar() {
  const { signOut, member, user } = useAuth()
  const { isOwner, hasAccess, shouldShowInSidebar, isTrialExpired, getTrialInfo } = useModules()
  const permissions = usePermissions()
  const location = useLocation()

  // Load initial state from localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // Ignore parse errors
    }
    // Default: first group open
    return { 'leden-sales': true }
  })

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(openGroups))
  }, [openGroups])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const displayName = member
    ? `${member.first_name} ${member.last_name}`
    : user?.email?.split('@')[0] || 'Gebruiker'

  // Build modules group dynamically based on access
  // Owner tenant sees ALL modules (full access)
  // Other tenants: modules visible if they have subscription (active, trial, or expired)
  // Expired trials show with "Verlopen" badge and disabled access
  const modulesGroup: NavGroup = {
    ...modulesGroupBase,
    items: [
      // Shop (owner always sees, others need subscription)
      ...(isOwner || shouldShowInSidebar('shop')
        ? [
          {
            name: 'Shop',
            href: '/shop',
            icon: ShoppingBag,
            trialBadge: getTrialInfo('shop').isTrialing ? getTrialInfo('shop').daysLeft : null,
            expiredBadge: isTrialExpired('shop'),
            disabled: !hasAccess('shop'),
          },
        ]
        : []),
      // Email Marketing (owner always sees, others need subscription)
      ...(isOwner || shouldShowInSidebar('email')
        ? [
          {
            name: 'Email',
            href: '/email',
            icon: Mail,
            trialBadge: getTrialInfo('email').isTrialing ? getTrialInfo('email').daysLeft : null,
            expiredBadge: isTrialExpired('email'),
            disabled: !hasAccess('email'),
          },
        ]
        : []),
      // GymScreen (core module - always visible)
      {
        name: 'GymScreen',
        href: '/gymscreen',
        icon: Monitor,
      },
      // Creative Fighter Studio (external link - always visible)
      {
        name: 'Fighter Studio',
        href: 'https://creative.mmagym.be',
        icon: Palette,
        external: true,
      },
    ],
  }

  // Auto-open group when navigating to a route within it
   
  useEffect(() => {
    const allGroups = [...navigationGroups, modulesGroup, beheerGroup]
    for (const group of allGroups) {
      const hasActiveRoute = group.items.some(
        (item) => item.href === location.pathname || location.pathname.startsWith(item.href + '/')
      )
      if (hasActiveRoute && !openGroups[group.id]) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }))
        break
      }
    }
  }, [location.pathname])

  // Helper to check if user has permission for an item
  const hasPermission = (item: NavItem): boolean => {
    // If no permission specified, accessible to all authenticated users
    if (!item.permission) return true

    // Check the permission from usePermissions
    return Boolean(permissions[item.permission])
  }

  // All groups for rendering
  const allGroups = [
    ...navigationGroups,
    modulesGroup,
    beheerGroup,
  ]

  return (
    <aside className="w-64 bg-neutral-950 border-r border-white/10 min-h-screen flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-[20px] font-semibold text-neutral-50 tracking-tight">RCN</h1>
        <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mt-1">Reconnect Academy</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Standalone items (Dashboard) */}
        <ul className="space-y-1">
          {standaloneItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-br from-white/10 to-white/0 text-amber-300 border border-white/10'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-50 border border-transparent'
                  }`
                }
              >
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[14px] font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Kitana AI Section - Premium Smart Feature */}
        <div className="my-4">
          <NavLink
            to="/kitana"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40'
                  : 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 hover:from-amber-500/15 hover:to-orange-500/10 hover:border-amber-500/30'
              }`
            }
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />

            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/20">
                <img
                  src={KITANA_AVATAR}
                  alt="Kitana AI"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-neutral-950 shadow-lg shadow-emerald-400/50" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-amber-300">Kitana AI</span>
                <Sparkles size={12} className="text-amber-400" />
              </div>
              <span className="text-[11px] text-neutral-500">Smart Assistant</span>
            </div>

            {/* Badge */}
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded-full font-medium">
              Pro
            </span>
          </NavLink>
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-white/10" />

        {/* Collapsible groups */}
        <div className="space-y-2">
          {allGroups.map((group) => {
            // Filter items based on permissions
            const visibleItems = group.items.filter((item) => {
              // Legacy adminOnly check (kept for backward compatibility)
              if (item.adminOnly && member?.role !== 'admin') return false

              // New permission-based check
              return hasPermission(item)
            })

            // Skip empty groups
            if (visibleItems.length === 0) return null

            const isOpen = openGroups[group.id]
            const hasActiveItem = visibleItems.some(
              (item) =>
                !item.external &&
                (item.href === location.pathname || location.pathname.startsWith(item.href + '/'))
            )

            // Add separator before Modules group
            const showSeparator = group.id === 'modules'

            return (
              <div key={group.id}>
                {showSeparator && <div className="my-4 border-t border-white/10" />}

                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${hasActiveItem
                      ? 'text-amber-300'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                    }`}
                >
                  <group.icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-[12px] font-semibold uppercase tracking-wider flex-1 text-left">
                    {group.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                      }`}
                    strokeWidth={1.5}
                  />
                </button>

                {/* Group items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <ul className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-2">
                    {visibleItems.map((item) => (
                      <li key={item.name}>
                        {item.external ? (
                          // External link
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-400 hover:bg-white/5 hover:text-neutral-50 transition-all duration-200"
                          >
                            <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            <span className="text-[13px] font-medium flex-1">{item.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        ) : item.disabled ? (
                          // Disabled link (expired trial)
                          <div
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-600 cursor-not-allowed opacity-60"
                            title="Trial verlopen - upgrade om toegang te krijgen"
                          >
                            <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            <span className="text-[13px] font-medium">{item.name}</span>
                            {item.expiredBadge && (
                              <span className="ml-auto bg-red-500/20 text-red-400 text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-red-500/30">
                                Verlopen
                              </span>
                            )}
                          </div>
                        ) : (
                          // Internal link
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-br from-white/10 to-white/0 text-amber-300 border border-white/10'
                                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-50 border border-transparent'
                              }`
                            }
                          >
                            <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            <span className="text-[13px] font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto bg-amber-300 text-neutral-950 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {item.trialBadge && (
                              <span className="ml-auto bg-purple-500/20 text-purple-300 text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30">
                                {item.trialBadge}d
                              </span>
                            )}
                          </NavLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
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
