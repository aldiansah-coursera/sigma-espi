const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-amber-100 text-amber-700',
  Diajukan: 'bg-indigo-100 text-indigo-700',
  Diteruskan: 'bg-blue-100 text-blue-700',
  Disetujui: 'bg-emerald-100 text-emerald-700',
  Diterbitkan: 'bg-teal-100 text-teal-700',
  Checked: 'bg-blue-100 text-blue-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Aktif: 'bg-emerald-100 text-emerald-700',
  Ready: 'bg-teal-100 text-teal-700',
  Pending: 'bg-amber-100 text-amber-700',
  Terjadwal: 'bg-blue-100 text-blue-700',
  Ditolak: 'bg-rose-100 text-rose-700',
  Rejected: 'bg-rose-100 text-rose-700',
}

export function statusBadgeClass(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}
