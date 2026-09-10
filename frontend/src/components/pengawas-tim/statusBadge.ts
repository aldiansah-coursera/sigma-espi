// Palet warna badge status khusus modul Pengawas Tim (Persetujuan PKA,
// Validasi KKA & Temuan). Mengikuti pola components/ketua-tim/statusBadge.ts.
const STATUS_STYLES: Record<string, string> = {
  Disetujui: 'bg-emerald-100 text-emerald-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Valid: 'bg-emerald-100 text-emerald-700',
  Berjalan: 'bg-blue-100 text-blue-700',
  Menunggu: 'bg-amber-100 text-amber-700',
  'Menunggu Validasi': 'bg-amber-100 text-amber-700',
  'Menunggu Persetujuan': 'bg-amber-100 text-amber-700',
  Revisi: 'bg-rose-100 text-rose-700',
  Ditolak: 'bg-rose-100 text-rose-700',
}

export function pengawasStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}
