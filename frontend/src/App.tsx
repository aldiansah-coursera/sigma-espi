import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './context/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoadingScreen } from './pages/LoadingScreen'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUnitsPage } from './pages/admin/AdminUnitsPage'
import { AdminReferensiPage } from './pages/admin/AdminReferensiPage'
import { AdminKompetensiPage } from './pages/admin/AdminKompetensiPage'
import { KepalaSpiDashboardPage } from './pages/kepala-spi/KepalaSpiDashboardPage'
import { PersetujuanPkptPage } from './pages/kepala-spi/PersetujuanPkptPage'
import { PersetujuanPppPage as KepalaSpiPersetujuanPppPage } from './pages/kepala-spi/PersetujuanPppPage'
import { PenerbitanStaPage } from './pages/kepala-spi/PenerbitanStaPage'
import { OtorisasiLhaPage } from './pages/kepala-spi/OtorisasiLhaPage'
import { DokumenProgramReviewPage } from './pages/kepala-spi/DokumenProgramReviewPage'
import { KetuaTimDashboardPage } from './pages/ketua-tim/KetuaTimDashboardPage'
import { PengajuanPkaPage } from './pages/ketua-tim/PengajuanPkaPage'
import { PengajuanPppPage } from './pages/ketua-tim/PengajuanPppPage'
import { PelaksanaanKkaPage } from './pages/ketua-tim/PelaksanaanKkaPage'
import { EksposTemuanPage } from './pages/ketua-tim/EksposTemuanPage'
import { PenyusunanLhaPage } from './pages/ketua-tim/PenyusunanLhaPage'
import { VerifikasiBuktiPage } from './pages/ketua-tim/VerifikasiBuktiPage'
import { AuditorDashboardPage } from './pages/auditor/AuditorDashboardPage'
import { PemeriksaanLapanganKkaPage } from './pages/auditor/PemeriksaanLapanganKkaPage'
import { TemuanAuditKkptPage } from './pages/auditor/TemuanAuditKkptPage'
import { RevisiKkaTemuanPage } from './pages/auditor/RevisiKkaTemuanPage'
import { PengawasTimDashboardPage } from './pages/pengawas-tim/PengawasTimDashboardPage'
import { PersetujuanPkaPage } from './pages/pengawas-tim/PersetujuanPkaPage'
import { PersetujuanPppPage as PengawasPersetujuanPppPage } from './pages/pengawas-tim/PersetujuanPppPage'
import { ValidasiKkaTemuanPage } from './pages/pengawas-tim/ValidasiKkaTemuanPage'
import { JaminanKualitasDashboardPage } from './pages/jaminan-kualitas/JaminanKualitasDashboardPage'
import { ReviuMetodologiPage } from './pages/jaminan-kualitas/ReviuMetodologiPage'
import { ValidasiMutuLhaPage } from './pages/jaminan-kualitas/ValidasiMutuLhaPage'
import { AuditeeBerandaPage } from './pages/auditee/AuditeeBerandaPage'
import { KonfirmasiTemuanPage } from './pages/auditee/KonfirmasiTemuanPage'
import { TemuanRekomendasiLhaPage } from './pages/auditee/TemuanRekomendasiLhaPage'
import { RencanaAksiBuktiPage } from './pages/auditee/RencanaAksiBuktiPage'
import { SurveiKepuasanPage } from './pages/auditee/SurveiKepuasanPage'
import { DukunganAuditDashboardPage } from './pages/dukungan-audit/DukunganAuditDashboardPage'
import { DokumenProgramPage } from './pages/dukungan-audit/DokumenProgramPage'
import { DataPkptPage } from './pages/dukungan-audit/DataPkptPage'
import { SuratTugasPage } from './pages/dukungan-audit/SuratTugasPage'
import {
  ADMIN_ROLE_CODE,
  KEPALA_SPI_ROLE_CODE,
  KETUA_TIM_ROLE_CODE,
  AUDITOR_ROLE_CODE,
  PENGAWAS_ROLE_CODE,
  JAMINAN_KUALITAS_ROLE_CODE,
  AUDITEE_ROLE_CODE,
  DUKUNGAN_AUDIT_ROLE_CODE,
  DUKUNGAN_AUDIT_STAFF_ROLE_CODE,
  resolveHomeRoute,
} from './lib/roles'

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
  // Splash juga berlaku untuk /forgot-password & /reset-password -- sama-sama
  // halaman auth publik yang bisa jadi entry point pertama (dibuka langsung
  // dari link email), jadi treatment-nya disamakan dengan /login.
  const isLoginRoute =
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'
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
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
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
        path="/admin/units"
        element={
          <ProtectedRoute requireRole={ADMIN_ROLE_CODE}>
            <AdminUnitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/referensi"
        element={
          <ProtectedRoute requireRole={ADMIN_ROLE_CODE}>
            <AdminReferensiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kompetensi"
        element={
          <ProtectedRoute requireRole={ADMIN_ROLE_CODE}>
            <AdminKompetensiPage />
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
        path="/kepala-spi/ppp"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <KepalaSpiPersetujuanPppPage />
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
      <Route
        path="/kepala-spi/dokumen-program"
        element={
          <ProtectedRoute requireRole={KEPALA_SPI_ROLE_CODE}>
            <DokumenProgramReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/dashboard"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <KetuaTimDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/ppp"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <PengajuanPppPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/pka"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <PengajuanPkaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/kka"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <PelaksanaanKkaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/ekspos-temuan"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <EksposTemuanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/lha"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <PenyusunanLhaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ketua-tim/verifikasi-bukti"
        element={
          <ProtectedRoute requireRole={KETUA_TIM_ROLE_CODE}>
            <VerifikasiBuktiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengawas-tim/dashboard"
        element={
          <ProtectedRoute requireRole={PENGAWAS_ROLE_CODE}>
            <PengawasTimDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengawas-tim/persetujuan-ppp"
        element={
          <ProtectedRoute requireRole={PENGAWAS_ROLE_CODE}>
            <PengawasPersetujuanPppPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengawas-tim/persetujuan-pka"
        element={
          <ProtectedRoute requireRole={PENGAWAS_ROLE_CODE}>
            <PersetujuanPkaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengawas-tim/validasi-kka"
        element={
          <ProtectedRoute requireRole={PENGAWAS_ROLE_CODE}>
            <ValidasiKkaTemuanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jaminan-kualitas/dashboard"
        element={
          <ProtectedRoute requireRole={JAMINAN_KUALITAS_ROLE_CODE}>
            <JaminanKualitasDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jaminan-kualitas/reviu-metodologi"
        element={
          <ProtectedRoute requireRole={JAMINAN_KUALITAS_ROLE_CODE}>
            <ReviuMetodologiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jaminan-kualitas/validasi-mutu-lha"
        element={
          <ProtectedRoute requireRole={JAMINAN_KUALITAS_ROLE_CODE}>
            <ValidasiMutuLhaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditee/beranda"
        element={
          <ProtectedRoute requireRole={AUDITEE_ROLE_CODE}>
            <AuditeeBerandaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditee/konfirmasi-temuan"
        element={
          <ProtectedRoute requireRole={AUDITEE_ROLE_CODE}>
            <KonfirmasiTemuanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditee/temuan-lha"
        element={
          <ProtectedRoute requireRole={AUDITEE_ROLE_CODE}>
            <TemuanRekomendasiLhaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditee/rencana-aksi"
        element={
          <ProtectedRoute requireRole={AUDITEE_ROLE_CODE}>
            <RencanaAksiBuktiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditee/survei-kepuasan"
        element={
          <ProtectedRoute requireRole={AUDITEE_ROLE_CODE}>
            <SurveiKepuasanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/dashboard"
        element={
          <ProtectedRoute requireRole={AUDITOR_ROLE_CODE}>
            <AuditorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/pemeriksaan-kka"
        element={
          <ProtectedRoute requireRole={AUDITOR_ROLE_CODE}>
            <PemeriksaanLapanganKkaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/temuan-kkpt"
        element={
          <ProtectedRoute requireRole={AUDITOR_ROLE_CODE}>
            <TemuanAuditKkptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/revisi"
        element={
          <ProtectedRoute requireRole={AUDITOR_ROLE_CODE}>
            <RevisiKkaTemuanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dukungan-audit/dashboard"
        element={
          <ProtectedRoute requireRole={[DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE]}>
            <DukunganAuditDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dukungan-audit/pkpt"
        element={
          <ProtectedRoute requireRole={[DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE]}>
            <DataPkptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dukungan-audit/surat-tugas"
        element={
          <ProtectedRoute requireRole={[DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE]}>
            <SuratTugasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dukungan-audit/dokumen-program"
        element={
          <ProtectedRoute requireRole={[DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE]}>
            <DokumenProgramPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
