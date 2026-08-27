import type { ReactNode } from 'react'
import { Briefcase, ClipboardCheck, FileCheck2, LayoutGrid } from 'lucide-react'
import { Sidebar } from '../ui/Sidebar'
import type { SidebarNavItem } from '../ui/Sidebar'
import { Topbar } from '../ui/Topbar'

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
    <div className="h-screen overflow-hidden bg-slate-50">
      <Sidebar navItems={KEPALA_SPI_NAV_ITEMS} />

      <div className="ml-72 flex h-screen min-w-0 flex-col overflow-hidden">
        <Topbar searchValue={searchValue} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder} />

        <main className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
