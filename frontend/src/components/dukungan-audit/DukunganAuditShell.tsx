import type { ReactNode } from 'react'
import { CalendarRange, FileSignature, FileStack, LayoutGrid } from 'lucide-react'
import { AppShell } from '../ui/AppShell'
import type { SidebarNavItem } from '../ui/Sidebar'

export const DUKUNGAN_AUDIT_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/dukungan-audit/dashboard' },
  { label: 'Data PKPT', icon: CalendarRange, path: '/dukungan-audit/pkpt' },
  { label: 'Surat Tugas (ST)', icon: FileSignature, path: '/dukungan-audit/surat-tugas' },
  { label: 'Dokumen Program', icon: FileStack, path: '/dukungan-audit/dokumen-program' },
]

interface DukunganAuditShellProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

/**
 * Kerangka halaman khusus role Dukungan Audit (DA) -- bekerja sebagai
 * asisten yang menyusun draf Dokumen Program (DOK PROG di diagram alur);
 * pemeriksaan (Checked) & persetujuan (Approved) dokumennya ada di sisi
 * Kepala SPI (lihat KepalaSpiShell -> Dokumen Program).
 */
export function DukunganAuditShell({ searchValue, onSearchChange, searchPlaceholder, children }: DukunganAuditShellProps) {
  return (
    <AppShell navItems={DUKUNGAN_AUDIT_NAV_ITEMS} searchValue={searchValue} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder}>
      {children}
    </AppShell>
  )
}
