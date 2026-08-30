import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { SidebarNavItem } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  navItems: SidebarNavItem[]
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  pendingCount?: number
  hasUnreadPending?: boolean
  onNotifOpen?: () => void
  children: ReactNode
}

/**
 * Kerangka halaman bersama (Sidebar + Topbar + area konten) yang dipakai
 * semua dashboard (Admin, Kepala SPI, dst). Mengelola state buka/tutup
 * panel Sidebar di layar < lg (mobile/tablet portrait) -- di layar >= lg
 * Sidebar selalu tampil statis seperti sebelumnya, tanpa overlay.
 */
export function AppShell({
  navItems,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  pendingCount,
  hasUnreadPending,
  onNotifOpen,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen min-w-0 flex-col overflow-hidden lg:ml-72">
        <Topbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          pendingCount={pendingCount}
          hasUnreadPending={hasUnreadPending}
          onNotifOpen={onNotifOpen}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 space-y-8 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
