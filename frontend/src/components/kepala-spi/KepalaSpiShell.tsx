import type { ReactNode } from 'react'
import { Briefcase, ClipboardCheck, FileCheck2, LayoutGrid } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const KEPALA_SPI_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/kepala-spi/dashboard' },
  { label: 'Persetujuan PKPT', icon: ClipboardCheck, path: '/kepala-spi/pkpt' },
  { label: 'Penerbitan STA', icon: Briefcase, path: '/kepala-spi/sta' },
  { label: 'Otorisasi LHA', icon: FileCheck2, path: '/kepala-spi/lha' },
]

interface KepalaSpiShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

export function KepalaSpiShell({ searchValue, onSearchChange, searchPlaceholder, children }: KepalaSpiShellProps) {
  return (
    <AppShell
      navItems={KEPALA_SPI_NAV_ITEMS}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </AppShell>
  )
}
