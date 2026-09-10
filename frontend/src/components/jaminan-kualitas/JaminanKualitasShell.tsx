import type { ReactNode } from 'react'
import { BadgeCheck, LayoutGrid, ListChecks } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const JAMINAN_KUALITAS_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/jaminan-kualitas/dashboard' },
  { label: 'Reviu Metodologi', icon: ListChecks, path: '/jaminan-kualitas/reviu-metodologi' },
  { label: 'Validasi Mutu LHA', icon: BadgeCheck, path: '/jaminan-kualitas/validasi-mutu-lha' },
]

interface JaminanKualitasShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Tim Jaminan Kualitas (QA) -- mengikuti pola
 * yang sama dengan shell role lain. QA berperan pada reviu metodologi
 * PKA & KKA, lalu validasi mutu LHA (gerbang D2) sebelum ke Kepala SPI.
 */
export function JaminanKualitasShell({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}: JaminanKualitasShellProps) {
  return (
    <AppShell
      navItems={JAMINAN_KUALITAS_NAV_ITEMS}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </AppShell>
  )
}
