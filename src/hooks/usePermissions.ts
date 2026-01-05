import { useMemo } from 'react'
import { useAuth } from './useAuth'

/**
 * Rol hiërarchie voor Reconnect Academy CRM
 *
 * TEAM ROLLEN (onbeperkte gym toegang, geen abonnement nodig):
 *   admin       → Volledige toegang, kan alles
 *   medewerker  → Leden beheer, check-ins, geen financiën
 *   coordinator → Rooster, groepen, communicatie
 *   coach       → Eigen lessen zien, aanwezigheid
 *
 * LEDEN ROLLEN (gym toegang afhankelijk van abonnement):
 *   fighter     → Eigen profiel, check-in (vereist actief abonnement)
 *   fan         → Supporter zonder gym toegang
 *
 * TOEGANGSREGELS:
 *   - Team rollen hebben ALTIJD gym toegang (QR/deur) zonder abonnement
 *   - Team rollen hoeven NIET te reserveren voor lessen
 *   - Fighters hebben gym toegang ALLEEN met actief abonnement
 *   - Fans hebben GEEN gym toegang
 */

export type Role = 'admin' | 'medewerker' | 'coordinator' | 'coach' | 'fighter' | 'fan'

// Rol hiërarchie niveau (hoger = meer rechten)
const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  medewerker: 80,
  coordinator: 60,
  coach: 40,
  fighter: 20,
  fan: 10,
}

// Rollen die als "team" worden beschouwd (hebben speciale toegang)
export const TEAM_ROLES: Role[] = ['admin', 'medewerker', 'coordinator', 'coach']

// Rollen die "staff" zijn (kunnen leden beheren)
export const STAFF_ROLES: Role[] = ['admin', 'medewerker', 'coordinator']

// Rol metadata voor UI
export const ROLE_INFO: Record<Role, { label: string; description: string; color: string }> = {
  admin: {
    label: 'Administrator',
    description: 'Volledige toegang tot alles',
    color: 'rose',
  },
  medewerker: {
    label: 'Medewerker',
    description: 'Leden beheer, check-ins, geen financiën',
    color: 'blue',
  },
  coordinator: {
    label: 'Coördinator',
    description: 'Rooster, groepen, communicatie',
    color: 'purple',
  },
  coach: {
    label: 'Coach',
    description: 'Eigen lessen zien, aanwezigheid',
    color: 'amber',
  },
  fighter: {
    label: 'Fighter',
    description: 'Lid met gym toegang',
    color: 'emerald',
  },
  fan: {
    label: 'Fan',
    description: 'Supporter zonder gym toegang',
    color: 'neutral',
  },
}

export interface Permissions {
  // Huidige gebruiker info
  currentRole: Role | null
  isAuthenticated: boolean

  // Rol checks
  isAdmin: boolean
  isStaff: boolean       // admin, medewerker, coordinator
  isTeamMember: boolean  // admin, medewerker, coordinator, coach
  isFighter: boolean
  isFan: boolean

  // Specifieke permissies
  canManageRoles: boolean          // Kan rollen van anderen wijzigen
  canViewAllMembers: boolean       // Kan alle leden zien
  canEditMembers: boolean          // Kan leden bewerken
  canManageFinances: boolean       // Kan financiën zien/beheren
  canManageSchedule: boolean       // Kan rooster beheren
  canViewSchedule: boolean         // Kan rooster bekijken
  canCheckInMembers: boolean       // Kan leden inchecken
  canManageLeads: boolean          // Kan leads beheren
  canAccessGym: boolean            // Heeft fysieke gym toegang

  // Helper functies
  hasRole: (role: Role) => boolean
  hasMinimumRole: (role: Role) => boolean
  canAssignRole: (targetRole: Role) => boolean
  canModifyMember: (memberRole: Role) => boolean
}

export function usePermissions(): Permissions {
  const { member, isAuthenticated } = useAuth()

  const currentRole = (member?.role as Role) || null
  const roleLevel = currentRole ? ROLE_HIERARCHY[currentRole] : 0

  const permissions = useMemo<Permissions>(() => {
    // Basis rol checks
    const isAdmin = currentRole === 'admin'
    const isStaff = STAFF_ROLES.includes(currentRole as Role)
    const isTeamMember = TEAM_ROLES.includes(currentRole as Role)
    const isFighter = currentRole === 'fighter'
    const isFan = currentRole === 'fan'

    // Helper: heeft gebruiker minimaal deze rol?
    const hasMinimumRole = (role: Role): boolean => {
      if (!currentRole) return false
      return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[role]
    }

    // Helper: heeft gebruiker exact deze rol?
    const hasRole = (role: Role): boolean => currentRole === role

    // Helper: kan deze rol toewijzen aan anderen?
    // Admin kan alle rollen toewijzen
    // Anderen kunnen alleen lagere rollen toewijzen
    const canAssignRole = (targetRole: Role): boolean => {
      if (!currentRole) return false
      if (isAdmin) return true
      // Niet-admins kunnen geen admin maken
      if (targetRole === 'admin') return false
      // Kan alleen rollen onder eigen niveau toewijzen
      return ROLE_HIERARCHY[currentRole] > ROLE_HIERARCHY[targetRole]
    }

    // Helper: kan dit lid wijzigen?
    // Admin kan iedereen wijzigen
    // Anderen kunnen alleen leden met lagere rol wijzigen
    const canModifyMember = (memberRole: Role): boolean => {
      if (!currentRole) return false
      if (isAdmin) return true
      // Kan alleen leden met lagere rol wijzigen
      return ROLE_HIERARCHY[currentRole] > ROLE_HIERARCHY[memberRole]
    }

    return {
      // Huidige gebruiker info
      currentRole,
      isAuthenticated,

      // Rol checks
      isAdmin,
      isStaff,
      isTeamMember,
      isFighter,
      isFan,

      // Specifieke permissies
      canManageRoles: isAdmin,  // Alleen admins kunnen rollen wijzigen
      canViewAllMembers: isTeamMember,
      canEditMembers: isStaff,
      canManageFinances: isAdmin,
      canManageSchedule: isStaff,
      canViewSchedule: isTeamMember || isFighter,
      canCheckInMembers: isStaff,
      canManageLeads: isStaff,
      canAccessGym: isTeamMember || isFighter,  // Iedereen behalve fans

      // Helper functies
      hasRole,
      hasMinimumRole,
      canAssignRole,
      canModifyMember,
    }
  }, [currentRole, isAuthenticated, roleLevel])

  return permissions
}

// Standalone functie voor gebruik buiten React componenten
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[role]
}

export function isValidRole(role: string): role is Role {
  return role in ROLE_HIERARCHY
}

/**
 * Check of een rol een abonnement nodig heeft voor gym toegang
 * Team rollen (admin, medewerker, coordinator, coach) hebben GEEN abonnement nodig
 */
export function requiresSubscription(role: Role): boolean {
  return !TEAM_ROLES.includes(role)
}

/**
 * Check of een rol reservaties nodig heeft voor lessen
 * Team rollen hoeven niet te reserveren
 */
export function requiresReservation(role: Role): boolean {
  return !TEAM_ROLES.includes(role)
}

/**
 * Check of een rol onbeperkte gym toegang heeft
 * Team rollen hebben altijd toegang, ongeacht abonnement status
 */
export function hasUnlimitedGymAccess(role: Role): boolean {
  return TEAM_ROLES.includes(role)
}
