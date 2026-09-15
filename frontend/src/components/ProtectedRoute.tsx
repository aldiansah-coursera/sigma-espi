import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  // String tunggal (role harus persis sama) atau array (role user harus
  // salah satu dari daftar ini) -- dipakai utk rute yang boleh diakses
  // lebih dari 1 role, mis. Dukungan Audit & Dukungan Audit Staff.
  requireRole?: string | string[]
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole.includes(user.role) : user.role === requireRole
    if (!allowed) {
      return <Navigate to="/" replace />
    }
  }
  return <>{children}</>
}
