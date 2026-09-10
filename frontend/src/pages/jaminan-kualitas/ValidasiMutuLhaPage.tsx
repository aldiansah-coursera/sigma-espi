import { useMemo, useState } from 'react'
import { BadgeCheck, FileText, RotateCcw } from 'lucide-react'
import { JaminanKualitasShell } from '../../components/jaminan-kualitas/JaminanKualitasShell'
import { qaStatusBadgeClass } from '../../components/jaminan-kualitas/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface DrafLha {
  id: number
  noLha: string
  ketuaTim: string
  drafLha: string
  status: string
  catatanMutu: string
}

// Data contoh (statis) -- gerbang validasi mutu Laporan Hasil Audit (LHA)
// oleh Jaminan Kualitas sebelum diteruskan ke Kepala SPI untuk otorisasi
// akhir. Sisi backend belum dibangun.
const INITIAL_LHA: DrafLha[] = [
  {
    id: 1,
    noLha: 'LHA/041/001',
    ketuaTim: 'Ahmad Fauzi',
    drafLha:
      'Ringkasan Eksekutif: Audit Pengujian Mesin Hangar 3 menemukan 3 temuan dengan tingkat risiko sedang hingga tinggi terkait keterlambatan perawatan berkala. Rekomendasi utama: percepatan proses pengadaan suku cadang kritis dan penambahan eskalasi otomatis pada sistem monitoring perawatan.',
    status: 'Menunggu Sign-off',
    catatanMutu: '',
  },
  {
    id: 2,
    noLha: 'LHA/041/002',
    ketuaTim: 'Siti Rahayu',
    drafLha:
      'Ringkasan Eksekutif: Audit Kepatuhan Prosedur K3 menunjukkan tingkat kepatuhan penggunaan APD sebesar 92% dengan 1 temuan minor terkait dokumentasi simulasi tanggap darurat.',
    status: 'Sign-off',
    catatanMutu: 'Struktur laporan dan bukti pendukung sudah memadai, disetujui untuk diteruskan ke Kepala SPI.',
  },
]

export function ValidasiMutuLhaPage() {
  const [lhaList, setLhaList] = useState<DrafLha[]>(INITIAL_LHA)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_LHA[0]?.id ?? null)

  const filteredLha = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return lhaList
    return lhaList.filter((l) => l.noLha.toLowerCase().includes(q) || l.ketuaTim.toLowerCase().includes(q))
  }, [lhaList, searchQuery])

  const menunggu = lhaList.filter((l) => l.status === 'Menunggu Sign-off').length
  const signOff = lhaList.filter((l) => l.status === 'Sign-off').length
  const selected = lhaList.find((l) => l.id === selectedId) ?? null

  function updateCatatan(id: number, catatanMutu: string) {
    setLhaList((prev) => prev.map((l) => (l.id === id ? { ...l, catatanMutu } : l)))
  }

  function setKeputusan(id: number, status: string) {
    setLhaList((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  return (
    <JaminanKualitasShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. LHA atau ketua tim">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Validasi Mutu LHA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Memverifikasi mutu draf Laporan Hasil Audit sebelum diteruskan untuk otorisasi Kepala SPI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Draf LHA" value={lhaList.length} icon={FileText} />
        <StatCard label="Menunggu Sign-off" value={menunggu} icon={RotateCcw} badge={menunggu > 0 ? 'Pending' : undefined} />
        <StatCard label="Sudah Sign-off" value={signOff} icon={BadgeCheck} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Draf LHA</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu draf untuk memvalidasi mutunya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.2fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. LHA</span>
          <span>Ketua Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredLha.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada draf LHA yang cocok.
            </div>
          )}
          {filteredLha.map((l) => (
            <div
              key={l.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[1fr_1.2fr_1fr_auto] ${selectedId === l.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{l.noLha}</div>
              <div className="truncate text-slate-600">{l.ketuaTim}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${qaStatusBadgeClass(l.status)}`}>
                {l.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(l.id)}
                className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 sm:justify-self-end"
              >
                Lihat Detail
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        {!selected ? (
          <p className="text-sm text-slate-500">Pilih salah satu draf LHA di atas untuk melihat detail validasi.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Validasi Mutu &ndash; {selected.noLha}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${qaStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Draf LHA</p>
              <p className="mt-1.5 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-sm">{selected.drafLha}</p>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Catatan Mutu</label>
              <textarea
                value={selected.catatanMutu}
                onChange={(e) => updateCatatan(selected.id, e.target.value)}
                rows={3}
                placeholder="Tuliskan catatan kualitas laporan (jika perlu revisi)"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={selected.status === 'Sign-off'}
                onClick={() => setKeputusan(selected.id, 'Perlu Revisi')}
                className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Kembalikan untuk Revisi
              </button>
              <button
                type="button"
                disabled={selected.status === 'Sign-off'}
                onClick={() => setKeputusan(selected.id, 'Sign-off')}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BadgeCheck size={16} />
                Sign-off
              </button>
            </div>
          </>
        )}
      </section>
    </JaminanKualitasShell>
  )
}
