import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './context/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoadingScreen } from './pages/LoadingScreen'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { KepalaSpiDashboardPage } from './pages/kepala-spi/KepalaSpiDashboardPage'
import { PersetujuanPkptPage } from './pages/kepala-spi/PersetujuanPkptPage'
import { PenerbitanStaPage } from './pages/kepala-spi/PenerbitanStaPage'
import { OtorisasiLhaPage } from './pages/kepala-spi/OtorisasiLhaPage'
import { ADMIN_ROLE_CODE, KEPALA_SPI_ROLE_CODE, resolveHomeRoute } from './lib/roles'

function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? resolveHomeRoute(user.role) : '/login'} replace />
}

// Mencegah pengguna yang sudah login membuka lagi halaman Login/Register.
function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) return <Navigate to={resolveHomeRoute(user.role)} replace />
  return <>{children}</>
}

// Splash screen kreatif (logo + fade-out) HANYA berlaku untuk rute
// "/login" -- lihat AppRoutes di bawah. Durasi minimum splash tetap
// tampil (ms) dan durasi transisi fade-out-nya (harus sinkron dengan
// duration-700 di LoadingScreen.tsx) didefinisikan di sini.
const MIN_SPLASH_MS = 1000
const SPLASH_FADE_MS = 700

function AppRoutes() {
  const { isInitializing } = useAuth()
  const location = useLocation()
  const isLoginRoute = location.pathname === '/login'
  const mountedAtRef = useRef(Date.now())

  // 'blocking' = auth bootstrap belum selesai (tunggu di belakang layar,
  // splash cuma kelihatan kalau isLoginRoute); 'fading' = splash Login
  // sedang menghilang; 'ready' = boleh render Routes yang sebenarnya.
  const [phase, setPhase] = useState<'blocking' | 'fading' | 'ready'>('blocking')

  // Dependency array HANYA isInitializing & isLoginRoute (bukan phase) --
  // supaya setState di dalam effect ini tidak memicu effect ini berjalan
  // ulang lalu membatalkan timeout-nya sendiri (pernah jadi bug: splash
  // macet di tengah fade dan cuma kelihatan layar polos, tidak pernah
  // lanjut ke halaman berikutnya).
  useEffect(() => {
    if (isInitializing) return

    if (!isLoginRoute) {
      // Rute selain /login: begitu sesi selesai divalidasi, langsung
      // render Routes yang sebenarnya -- tanpa splash visual dan tanpa
      // jeda buatan, supaya refresh di halaman lain (Register, dashboard,
      // dst) terasa instan seperti biasa.
      setPhase('ready')
      return
    }

    const elapsed = Date.now() - mountedAtRef.current
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
    let hideTimeout: ReturnType<typeof setTimeout> | undefined
    const showTimeout = setTimeout(() => {
      setPhase('fading')
      hideTimeout = setTimeout(() => setPhase('ready'), SPLASH_FADE_MS)
    }, remaining)

    return () => {
      clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
    }
  }, [isInitializing, isLoginRoute])

  if (phase === 'blocking') {
    return isLoginRoute ? <LoadingScreen /> : null
  }
  if (phase === 'fading') {
    return <LoadingScreen fadingOut />
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/coming-soon"
        element={
          <ProtectedRoute>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireRole={ADMIN_ROLE_CODE}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kepala-spi/dashboard"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <KepalaSpiDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kepala-spi/pkpt"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <PersetujuanPkptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kepala-spi/sta"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <PenerbitanStaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kepala-spi/lha"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <OtorisasiLhaPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
