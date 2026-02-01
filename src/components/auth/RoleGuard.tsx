import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'
import { usePermissions, type Role } from '../../hooks/usePermissions'

interface RoleGuardProps {
  children: ReactNode
  requiredRole?: Role
  allowedRoles?: Role[]
  permission?: keyof Omit<
    ReturnType<typeof usePermissions>,
    | 'currentRole'
    | 'isAuthenticated'
    | 'hasRole'
    | 'hasMinimumRole'
    | 'canAssignRole'
    | 'canModifyMember'
  >
  fallback?: ReactNode
}

/**
 * RoleGuard - Conditionally renders children based on role/permission requirements
 *
 * Usage:
 * - <RoleGuard requiredRole="admin">...</RoleGuard>
 * - <RoleGuard allowedRoles={['admin', 'medewerker']}>...</RoleGuard>
 * - <RoleGuard permission="canManageFinances">...</RoleGuard>
 *
 * Order of precedence:
 * 1. permission check (if provided)
 * 2. allowedRoles check (if provided)
 * 3. requiredRole check (if provided)
 */
export function RoleGuard({
  children,
  requiredRole,
  allowedRoles,
  permission,
  fallback,
}: RoleGuardProps) {
  const permissions = usePermissions()
  const navigate = useNavigate()

  // Check permission-based access
  if (permission) {
    const hasPermission = permissions[permission]
    if (!hasPermission) {
      return (
        <>
          {fallback || (
            <UnauthorizedMessage onBack={() => navigate(-1)} />
          )}
        </>
      )
    }
    return <>{children}</>
  }

  // Check role-based access (allowedRoles array)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(permissions.currentRole!)
    if (!hasAllowedRole) {
      return (
        <>
          {fallback || (
            <UnauthorizedMessage onBack={() => navigate(-1)} />
          )}
        </>
      )
    }
    return <>{children}</>
  }

  // Check role-based access (single requiredRole with hierarchy)
  if (requiredRole) {
    const hasMinRole = permissions.hasMinimumRole(requiredRole)
    if (!hasMinRole) {
      return (
        <>
          {fallback || (
            <UnauthorizedMessage onBack={() => navigate(-1)} />
          )}
        </>
      )
    }
    return <>{children}</>
  }

  // No restrictions - render children
  return <>{children}</>
}

// Default unauthorized message component
function UnauthorizedMessage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Geen toegang</h2>
        <p className="text-zinc-400 mb-6">
          Je hebt niet de juiste rechten om deze pagina te bekijken.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Terug
        </button>
      </div>
    </div>
  )
}
