import type { ReactNode } from 'react'
import { AlertTriangle, Briefcase, LayoutGrid, UploadCloud } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const AUDITOR_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/auditor/dashboard' },
  { label: 'Pemeriksaan Lapangan & KKA', icon: Briefcase, path: '/auditor/pemeriksaan-kka' },
  { label: 'Temuan Audit (KKPT)', icon: AlertTriangle, path: '/auditor/temuan-kkpt' },
  { label: 'Revisi KKA & Temuan', icon: UploadCloud, path: '/auditor/revisi' },
]

interface AuditorShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Auditor (Anggota Tim) -- mengikuti pola
 * yang sama dengan KetuaTimShell/PengawasTimShell (AppShell + daftar nav
 * item sendiri). Dipisahkan dari Ketua Tim sesuai revisi UI/UX: Auditor
 * mengerjakan pemeriksaan lapangan & input KKA serta merumuskan temuan
 * (KKPT) miliknya sendiri, sementara Ketua Tim hanya mereviu/menyetujui
 * pekerjaan tim (lihat KetuaTimShell -> Pelaksanaan & KKA).
 */
export function AuditorShell({ searchValue, onSearchChange, searchPlaceholder, children }: AuditorShellProps) {
  return (
    <AppShell navItems={AUDITOR_NAV_ITEMS} searchValue={searchValue} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder}>
      {children}
    </AppShell>
  )
}
