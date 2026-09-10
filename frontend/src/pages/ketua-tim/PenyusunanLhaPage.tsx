import { useState } from 'react'
import { AlertTriangle, ClipboardCheck, Eye, Send, SquarePen } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressRing } from '../../components/ui/ProgressRing'

interface BabRow {
  bab: string
  uraian: string
  penyusun: string
  status: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Penyusunan LHA sisi
// backend belum dibangun, jadi halaman ini murni tampilan dulu.
const STRUKTUR_BAB: BabRow[] = [
  { bab: 'BAB I', uraian: 'Pengujian Mesin Hangar 3', penyusun: 'Naufal', status: 'In Review' },
  { bab: 'BAB II', uraian: 'Pengujian Mesin Hangar 3', penyusun: 'Panji', status: 'Approved' },
  { bab: 'BAB III', uraian: 'Pengujian Mesin Hangar 3', penyusun: 'Fahri', status: 'In Review' },
  { bab: 'BAB IV', uraian: 'Pengujian Mesin Hangar 3', penyusun: 'Naufal', status: 'Approved' },
]

const PROGRES_DRAF_LHA_PERCENT = 80

export function PenyusunanLhaPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBab = STRUKTUR_BAB.filter((row) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return row.bab.toLowerCase().includes(q) || row.uraian.toLowerCase().includes(q)
  })

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari Objek Audit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Penyusunan Laporan Hasil Audit (LHA)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Finalisasi Draf LHA, Kompilasi Temuan Audit, dan Pengajuan Otorisasi Ke Kepala SPI.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          <Send size={16} />
          Kirim Ke Kepala SPI
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Progres Draf LHA"
          value={`${PROGRES_DRAF_LHA_PERCENT}%`}
          subtitle="Status: Tahap Finalisasi"
          customIcon={<ProgressRing percent={PROGRES_DRAF_LHA_PERCENT} />}
        />
        <StatCard label="Matriks Temuan Audit" value="3 Temuan" subtitle="1 High Risk, 2 Medium Risk" icon={AlertTriangle} />
        <StatCard label="Status Otorisasi" value="Pending Approval" subtitle="Siap Dikirim Ke Kepala SPI" icon={ClipboardCheck} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Struktur Bab &amp; Matriks Temuan Draf LHA</h2>
          <p className="mt-0.5 text-sm text-slate-500">Susunan bab Laporan Hasil Audit beserta status finalisasinya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[0.6fr_1.4fr_1fr_0.9fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Bab</span>
          <span>Bagian LHA | Uraian Ringkasan</span>
          <span>Penyusun / Auditor</span>
          <span>Status Bab</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredBab.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada bab yang cocok.
            </div>
          )}
          {filteredBab.map((row) => (
            <div
              key={row.bab}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[0.6fr_1.4fr_1fr_0.9fr_auto]"
            >
              <div className="truncate font-semibold text-blue-700">{row.bab}</div>
              <div className="min-w-0 truncate text-slate-600">{row.uraian}</div>
              <div className="truncate text-slate-600">{row.penyusun}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              {row.bab === 'BAB I' ? (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  <Eye size={14} />
                  Preview Bab
                </button>
              ) : row.bab === 'BAB IV' ? (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  <SquarePen size={14} />
                  Review BAB
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  <SquarePen size={14} />
                  Edit BAB
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <ClipboardCheck size={16} className="shrink-0" />
          Draf LHA sudah lolos Validasi Mutu QA (Gerbang D2) &ndash; siap diteruskan untuk Otorisasi Akhir Oleh Kepala
          SPI.
        </div>
      </section>
    </KetuaTimShell>
  )
}
