import { Construction } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { useAuth } from '../context/useAuth'
import { roleLabel } from '../lib/roles'

// Halaman sementara untuk role selain Admin. Dashboard Auditor, Ketua Tim,
// Kepala SPI, Tim QA, dan Auditee akan dibangun menyusul (sesuai arahan:
// fokus Admin dulu).
export function ComingSoonPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <Logo />
      <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Construction size={26} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Dashboard {user ? roleLabel(user.role) : ''} sedang dalam pengembangan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Anda berhasil masuk sebagai <strong className="font-semibold text-slate-700">{user?.nama}</strong>.
          Tampilan khusus untuk role ini akan menyusul.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>
    </div>
  )
}
