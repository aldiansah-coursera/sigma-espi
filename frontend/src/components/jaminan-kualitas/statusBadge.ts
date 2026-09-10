// Palet warna badge status khusus modul Jaminan Kualitas (QA) -- Reviu
// Metodologi & Validasi Mutu LHA.
const STATUS_STYLES: Record<string, string> = {
  Lolos: 'bg-emerald-100 text-emerald-700',
  Selesai: 'bg-emerald-100 text-emerald-700',
  'Sign-off': 'bg-emerald-100 text-emerald-700',
  Menunggu: 'bg-amber-100 text-amber-700',
  'Menunggu Reviu': 'bg-amber-100 text-amber-700',
  'Menunggu Sign-off': 'bg-amber-100 text-amber-700',
  Revisi: 'bg-rose-100 text-rose-700',
  'Perlu Revisi': 'bg-rose-100 text-rose-700',
}

export function qaStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}
