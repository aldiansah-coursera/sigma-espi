import type { ReactNode } from 'react'
import { FileText, Home, MessageSquare, Star, UploadCloud } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const AUDITEE_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Beranda', icon: Home, path: '/auditee/beranda' },
  { label: 'Konfirmasi Temuan', icon: MessageSquare, path: '/auditee/konfirmasi-temuan' },
  { label: 'Temuan & Rekomendasi LHA', icon: FileText, path: '/auditee/temuan-lha' },
  { label: 'Rencana Aksi & Bukti', icon: UploadCloud, path: '/auditee/rencana-aksi' },
  { label: 'Survei Kepuasan', icon: Star, path: '/auditee/survei-kepuasan' },
]

interface AuditeeShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Auditee -- mengikuti pola yang sama dengan
 * shell role lain. Auditee menerima ekspos temuan dari Ketua Tim,
 * menanggapi/mengklarifikasi, mengunggah bukti perbaikan, dan mengisi
 * survei kepuasan audit di akhir penugasan.
 */
export function AuditeeShell({ searchValue, onSearchChange, searchPlaceholder, children }: AuditeeShellProps) {
  return (
    <AppShell
      navItems={AUDITEE_NAV_ITEMS}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </AppShell>
  )
}
