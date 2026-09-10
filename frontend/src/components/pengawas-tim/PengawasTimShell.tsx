import type { ReactNode } from 'react'
import { FileCheck2, LayoutGrid, ShieldCheck } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const PENGAWAS_TIM_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/pengawas-tim/dashboard' },
  { label: 'Persetujuan PKA', icon: FileCheck2, path: '/pengawas-tim/persetujuan-pka' },
  { label: 'Validasi KKA & Temuan', icon: ShieldCheck, path: '/pengawas-tim/validasi-kka' },
]

interface PengawasTimShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Pengawas Tim -- mengikuti pola yang sama
 * dengan KetuaTimShell/KepalaSpiShell (AppShell + daftar nav item sendiri).
 * Pengawas Tim memegang gerbang D_PKA (persetujuan PKA) dan gerbang D1
 * (validasi KKA & temuan) sebelum naik ke Jaminan Kualitas.
 */
export function PengawasTimShell({ searchValue, onSearchChange, searchPlaceholder, children }: PengawasTimShellProps) {
  return (
    <AppShell
      navItems={PENGAWAS_TIM_NAV_ITEMS}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </AppShell>
  )
}
