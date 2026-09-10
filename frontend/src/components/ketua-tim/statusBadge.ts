// Palet warna badge status khusus modul Ketua Tim (PKA/KKA/Ekspos
// Temuan/LHA). Mengikuti pola components/kepala-spi/statusBadge.ts --
// status "positif" (disetujui/dikonfirmasi) hijau, "menunggu proses"
// biru/kuning, dan "ditolak/disanggah" merah.
const STATUS_STYLES: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  'No Findings': 'bg-emerald-100 text-emerald-700',
  Dikonfirmasi: 'bg-emerald-100 text-emerald-700',
  'In Review': 'bg-blue-100 text-blue-700',
  'Menunggu Respon': 'bg-blue-100 text-blue-700',
  'Ready Review': 'bg-amber-100 text-amber-700',
  'Pending Approval': 'bg-amber-100 text-amber-700',
  Disanggah: 'bg-amber-100 text-amber-700',
  Ditolak: 'bg-rose-100 text-rose-700',
  'Menunggu Verifikasi': 'bg-amber-100 text-amber-700',
  Diterima: 'bg-emerald-100 text-emerald-700',
  Dikembalikan: 'bg-rose-100 text-rose-700',
}

export function ktStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}

// Warna badge tingkat risiko (High/Medium/Low Risk) -- dipakai di halaman
// Pelaksanaan & KKA dan Ekspos Temuan.
const RISIKO_STYLES: Record<string, string> = {
  'High Risk': 'bg-rose-100 text-rose-700',
  '1 High Risk': 'bg-rose-100 text-rose-700',
  'Med Risk': 'bg-amber-100 text-amber-700',
  '1 Med Risk': 'bg-amber-100 text-amber-700',
  '2 Med Risk': 'bg-amber-100 text-amber-700',
  'Medium Risk': 'bg-amber-100 text-amber-700',
  'Low Risk': 'bg-blue-100 text-blue-700',
  'No Findings': 'bg-emerald-100 text-emerald-700',
}

export function ktRisikoBadgeClass(risiko: string | null | undefined): string {
  if (!risiko) return 'bg-slate-100 text-slate-600'
  return RISIKO_STYLES[risiko] ?? 'bg-slate-100 text-slate-600'
}
