import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types/auth'
import { getStoredToken, clearStoredToken } from '../lib/api'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '../services/authService'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // isInitializing murni mencerminkan proses pemulihan sesi yang sebenarnya
  // (validasi token tersimpan) -- TIDAK ada lagi jeda buatan di sini. Durasi
  // minimum splash + animasi fade-out sekarang jadi urusan AppRoutes
  // (App.tsx), dan sengaja hanya berlaku saat rute aktifnya "/login".
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getStoredToken()
      if (token) {
        try {
          const current = await fetchCurrentUser()
          if (!cancelled) setUser(current)
        } catch {
          clearStoredToken()
        }
      }
      if (!cancelled) setIsInitializing(false)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      login: async (email: string, password: string) => {
        const loggedInUser = await loginRequest({ email, password })
        setUser(loggedInUser)
        return loggedInUser
      },
      logout: () => {
        logoutRequest()
        setUser(null)
      },
    }),
    [user, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
