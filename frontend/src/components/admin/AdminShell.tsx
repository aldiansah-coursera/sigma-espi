import type { ReactNode } from 'react'
import { Building2, Users } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Kelola User & Role', icon: Users, path: '/admin/dashboard' },
  { label: 'Kelola Unit Kerja', icon: Building2, path: '/admin/units' },
]

interface AdminShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  pendingCount?: number
  hasUnreadPending?: boolean
  onNotifOpen?: () => void
  children: ReactNode
}

export function AdminShell({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  pendingCount,
  hasUnreadPending,
  onNotifOpen,
  children,
}: AdminShellProps) {
  return (
    <AppShell
      navItems={ADMIN_NAV_ITEMS}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      pendingCount={pendingCount}
      hasUnreadPending={hasUnreadPending}
      onNotifOpen={onNotifOpen}
    >
      {children}
    </AppShell>
  )
}
