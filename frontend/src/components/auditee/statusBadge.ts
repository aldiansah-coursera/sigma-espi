// Palet warna badge status khusus modul Auditee -- Konfirmasi Temuan,
// Temuan & Rekomendasi LHA, Rencana Aksi & Bukti Perbaikan.
const STATUS_STYLES: Record<string, string> = {
  Dikonfirmasi: 'bg-emerald-100 text-emerald-700',
  Diterima: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-emerald-100 text-emerald-700',
  'Menunggu Tanggapan': 'bg-blue-100 text-blue-700',
  'Menunggu Verifikasi': 'bg-blue-100 text-blue-700',
  Open: 'bg-amber-100 text-amber-700',
  'Perlu Perbaikan': 'bg-rose-100 text-rose-700',
  Dikembalikan: 'bg-rose-100 text-rose-700',
}

export function auditeeStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}

const PRIORITAS_STYLES: Record<string, string> = {
  Tinggi: 'bg-rose-100 text-rose-700',
  Sedang: 'bg-amber-100 text-amber-700',
  Rendah: 'bg-blue-100 text-blue-700',
}

export function auditeePrioritasBadgeClass(prioritas: string | null | undefined): string {
  if (!prioritas) return 'bg-slate-100 text-slate-600'
  return PRIORITAS_STYLES[prioritas] ?? 'bg-slate-100 text-slate-600'
}
