import { useMemo, useState } from 'react'
import { BadgeCheck, CheckCircle2, ListChecks } from 'lucide-react'
import { JaminanKualitasShell } from '../../components/jaminan-kualitas/JaminanKualitasShell'
import { qaStatusBadgeClass } from '../../components/jaminan-kualitas/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface AntreanReviu {
  jenisDokumen: string
  noReferensi: string
  ketuaTim: string
  status: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Jaminan Kualitas
// sisi backend belum dibangun, jadi dashboard ini murni tampilan ringkasan.
const ANTREAN_REVIU: AntreanReviu[] = [
  { jenisDokumen: 'Metodologi PKA & KKA', noReferensi: 'PKA/041/001', ketuaTim: 'Ahmad Fauzi', status: 'Menunggu Reviu' },
  { jenisDokumen: 'Draf LHA', noReferensi: 'LHA/041/001', ketuaTim: 'Siti Rahayu', status: 'Menunggu Sign-off' },
  { jenisDokumen: 'Metodologi PKA & KKA', noReferensi: 'PKA/041/002', ketuaTim: 'Budi Santoso', status: 'Selesai' },
  { jenisDokumen: 'Draf LHA', noReferensi: 'LHA/041/002', ketuaTim: 'Dewi Lestari', status: 'Perlu Revisi' },
]

export function JaminanKualitasDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAntrean = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return ANTREAN_REVIU
    return ANTREAN_REVIU.filter(
      (a) => a.noReferensi.toLowerCase().includes(q) || a.ketuaTim.toLowerCase().includes(q) || a.jenisDokumen.toLowerCase().includes(q),
    )
  }, [searchQuery])

  const antreanMetodologi = ANTREAN_REVIU.filter((a) => a.jenisDokumen === 'Metodologi PKA & KKA' && a.status === 'Menunggu Reviu').length
  const antreanLha = ANTREAN_REVIU.filter((a) => a.jenisDokumen === 'Draf LHA' && a.status === 'Menunggu Sign-off').length
  const selesai = ANTREAN_REVIU.filter((a) => a.status === 'Selesai').length

  return (
    <JaminanKualitasShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. referensi atau ketua tim">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dashboard Jaminan Kualitas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan antrean reviu metodologi audit dan validasi mutu Laporan Hasil Audit (LHA).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Antrean Reviu Metodologi" value={antreanMetodologi} icon={ListChecks} badge={antreanMetodologi > 0 ? 'Pending' : undefined} />
        <StatCard label="Antrean Validasi Mutu LHA" value={antreanLha} icon={BadgeCheck} badge={antreanLha > 0 ? 'Pending' : undefined} />
        <StatCard label="Selesai Bulan Ini" value={selesai} icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Antrean Reviu</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh dokumen yang masuk ke meja Jaminan Kualitas.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Jenis Dokumen</span>
          <span>No. Referensi</span>
          <span>Ketua Tim</span>
          <span>Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredAntrean.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada dokumen yang cocok.
            </div>
          )}
          {filteredAntrean.map((a, index) => (
            <div
              key={index}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.4fr_1fr_1fr_1fr]"
            >
              <div className="truncate font-semibold text-slate-800">{a.jenisDokumen}</div>
              <div className="truncate text-blue-700 font-semibold">{a.noReferensi}</div>
              <div className="truncate text-slate-600">{a.ketuaTim}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${qaStatusBadgeClass(a.status)}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </JaminanKualitasShell>
  )
}
