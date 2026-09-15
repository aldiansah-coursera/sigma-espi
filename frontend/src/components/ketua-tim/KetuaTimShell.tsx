import type { ReactNode } from 'react'
import { Briefcase, ClipboardList, FileSignature, LayoutGrid, Megaphone, ShieldCheck, Stamp } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const KETUA_TIM_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard Tim', icon: LayoutGrid, path: '/ketua-tim/dashboard' },
  { label: 'Pengajuan Penugasan (PPP)', icon: FileSignature, path: '/ketua-tim/ppp' },
  { label: 'Pengajuan PKA', icon: ClipboardList, path: '/ketua-tim/pka' },
  { label: 'Pelaksanaan & KKA', icon: Briefcase, path: '/ketua-tim/kka' },
  { label: 'Ekspos Temuan', icon: Megaphone, path: '/ketua-tim/ekspos-temuan' },
  { label: 'Penyusunan LHA', icon: Stamp, path: '/ketua-tim/lha' },
  { label: 'Verifikasi Bukti', icon: ShieldCheck, path: '/ketua-tim/verifikasi-bukti' },
]

interface KetuaTimShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Ketua Tim -- mengikuti pola yang sama
 * dengan AdminShell & KepalaSpiShell (AppShell + daftar nav item sendiri)
 * supaya tampilan konsisten di seluruh role.
 */
export function KetuaTimShell({ searchValue, onSearchChange, searchPlaceholder, children }: KetuaTimShellProps) {
  return (
    <AppShell navItems={KETUA_TIM_NAV_ITEMS} searchValue={searchValue} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder}>
      {children}
    </AppShell>
  )
}
