import { useMemo, useState } from 'react'
import { AlertTriangle, Bell, Briefcase, UploadCloud } from 'lucide-react'
import { AuditorShell } from '../../components/auditor/AuditorShell'
import { auditorStatusBadgeClass } from '../../components/auditor/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface Penugasan {
  noSt: string
  objekPengawasan: string
  peran: string
  status: string
}

interface Aktivitas {
  id: number
  pesan: string
  waktu: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Auditor (Anggota
// Tim) sisi backend belum dibangun, jadi dashboard ini murni tampilan
// ringkasan dulu. Dipisah dari Dashboard Ketua Tim: di sini hanya
// menampilkan penugasan di mana user berperan sebagai Anggota Tim.
const PENUGASAN_SAYA: Penugasan[] = [
  { noSt: 'ST/2026/014', objekPengawasan: 'Divisi Produksi Sayap', peran: 'Anggota Tim', status: 'Berjalan' },
  { noSt: 'ST/2026/012', objekPengawasan: 'Unit Pengadaan', peran: 'Anggota Tim', status: 'Reviu Ketua Tim' },
]

const AKTIVITAS_TERBARU: Aktivitas[] = [
  { id: 1, pesan: 'Ketua Tim meminta revisi pada KKA-0231', waktu: '1 hari lalu' },
  { id: 2, pesan: 'Temuan-0090 diteruskan Ketua Tim ke Pengawas Tim', waktu: '3 hari lalu' },
]

export function AuditorDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPenugasan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return PENUGASAN_SAYA
    return PENUGASAN_SAYA.filter((p) => p.noSt.toLowerCase().includes(q) || p.objekPengawasan.toLowerCase().includes(q))
  }, [searchQuery])

  return (
    <AuditorShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari KKA & Temuan">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dashboard Auditor</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan penugasan lapangan Anda sebagai Anggota Tim.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tugas Lapangan Aktif" value={PENUGASAN_SAYA.length} subtitle="Sebagai Anggota Tim" icon={Briefcase} />
        <StatCard label="KKA Perlu Direvisi" value={1} subtitle="Dari Ketua Tim" icon={UploadCloud} badge="Pending" />
        <StatCard label="Temuan Menunggu Reviu" value={2} subtitle="Oleh Ketua Tim" icon={AlertTriangle} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Penugasan Saya (sebagai Anggota Tim)</h2>
          <p className="mt-0.5 text-sm text-slate-500">Penugasan Surat Tugas Audit di mana Anda berperan sebagai Anggota Tim.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.6fr_1fr_1fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Penugasan</span>
          <span>Objek Pengawasan</span>
          <span>Peran</span>
          <span>Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredPenugasan.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada penugasan yang cocok.
            </div>
          )}
          {filteredPenugasan.map((p, index) => (
            <div
              key={index}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.6fr_1fr_1fr]"
            >
              <div className="truncate font-semibold text-blue-700">{p.noSt}</div>
              <div className="min-w-0 truncate text-slate-600">{p.objekPengawasan}</div>
              <div className="truncate text-slate-600">{p.peran}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditorStatusBadgeClass(p.status)}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-blue-700" />
          <h2 className="text-lg font-bold text-blue-950">Aktivitas Terbaru</h2>
        </div>
        <div className="mt-4 space-y-3">
          {AKTIVITAS_TERBARU.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{a.pesan}</p>
              <p className="mt-0.5 text-xs text-slate-400">{a.waktu}</p>
            </div>
          ))}
        </div>
      </section>
    </AuditorShell>
  )
}
