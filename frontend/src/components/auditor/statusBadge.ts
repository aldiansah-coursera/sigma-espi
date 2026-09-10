// Palet warna badge status khusus modul Auditor (Anggota Tim) -- Pemeriksaan
// Lapangan & Input KKA, Temuan Audit (KKPT), Revisi KKA & Temuan.
const STATUS_STYLES: Record<string, string> = {
  Terkunci: 'bg-emerald-100 text-emerald-700',
  Divalidasi: 'bg-blue-100 text-blue-700',
  Draft: 'bg-amber-100 text-amber-700',
  Berjalan: 'bg-blue-100 text-blue-700',
  'Reviu Ketua Tim': 'bg-amber-100 text-amber-700',
  'Menunggu Reviu Ketua Tim': 'bg-blue-100 text-blue-700',
  'Diteruskan ke Auditee': 'bg-emerald-100 text-emerald-700',
  'Perlu Revisi': 'bg-rose-100 text-rose-700',
  'Revisi Terkirim': 'bg-blue-100 text-blue-700',
  'Revisi Disetujui': 'bg-emerald-100 text-emerald-700',
}

export function auditorStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}

const PRIORITAS_STYLES: Record<string, string> = {
  Tinggi: 'bg-rose-100 text-rose-700',
  Sedang: 'bg-amber-100 text-amber-700',
  Rendah: 'bg-blue-100 text-blue-700',
}

export function auditorPrioritasBadgeClass(prioritas: string | null | undefined): string {
  if (!prioritas) return 'bg-slate-100 text-slate-600'
  return PRIORITAS_STYLES[prioritas] ?? 'bg-slate-100 text-slate-600'
}
