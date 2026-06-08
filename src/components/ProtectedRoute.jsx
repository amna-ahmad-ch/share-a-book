import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function AuthGate({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile?.isBlocked) {
    return <Navigate to="/blocked" replace />
  }

  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (profile && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}

export function ProtectedRoute({ children }) {
  return <AuthGate>{children}</AuthGate>
}

export function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile?.isAdmin || profile.isAdmin === false) return <Navigate to="/" replace />
  return children
}

export function PublicOnlyRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-primary animate-pulse">Loading…</div>
      </div>
    )
  }

  if (user && profile?.isBlocked) {
    return <Navigate to="/blocked" replace />
  }

  if (user && !profile) {
    return <Navigate to="/onboarding" replace />
  }

  if (user && profile) {
    return <Navigate to="/" replace />
  }

  return children
}
