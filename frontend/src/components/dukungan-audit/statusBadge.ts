// Palet warna badge status khusus modul Dukungan Audit -- alur Dokumen
// Program: Draft (staf) -> Diajukan (koordinator DA mengajukan) -> Checked
// -> Approved (Kepala SPI).
const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-amber-100 text-amber-700',
  Diajukan: 'bg-indigo-100 text-indigo-700',
  Checked: 'bg-blue-100 text-blue-700',
  Approved: 'bg-emerald-100 text-emerald-700',
}

export function dukunganAuditStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}
