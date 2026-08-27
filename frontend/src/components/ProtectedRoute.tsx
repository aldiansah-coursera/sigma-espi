import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: string
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
