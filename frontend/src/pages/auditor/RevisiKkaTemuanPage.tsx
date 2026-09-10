import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Save, Send } from 'lucide-react'
import { AuditorShell } from '../../components/auditor/AuditorShell'
import { auditorStatusBadgeClass } from '../../components/auditor/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface ItemRevisi {
  id: number
  item: string
  dimintaOleh: string
  catatan: string
  status: string
  perbaikan: string
}

// Data contoh (statis) -- perbaikan data KKA & temuan yang dikembalikan
// Ketua Tim atau Pengawas Tim. Sisi backend belum dibangun; "Catatan
// Revisi" dari peninjau bersifat baca-saja, sementara "Perbaikan Data"
// diisi Auditor sebelum dikirim ulang.
const INITIAL_REVISI: ItemRevisi[] = [
  {
    id: 1,
    item: 'KKA-0231',
    dimintaOleh: 'Ketua Tim',
    catatan: 'Bukti kurang lengkap untuk 1 prosedur -- mohon lampirkan foto/dokumen tambahan.',
    status: 'Perlu Revisi',
    perbaikan: '',
  },
  {
    id: 2,
    item: 'KKA-0198',
    dimintaOleh: 'Pengawas Tim',
    catatan: 'Kriteria belum sesuai standar -- rujuk kembali ke SOP terbaru sebelum dikirim ulang.',
    status: 'Perlu Revisi',
    perbaikan: '',
  },
]

export function RevisiKkaTemuanPage() {
  const [revisiList, setRevisiList] = useState<ItemRevisi[]>(INITIAL_REVISI)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_REVISI[0]?.id ?? null)

  const filteredRevisi = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return revisiList
    return revisiList.filter((r) => r.item.toLowerCase().includes(q) || r.dimintaOleh.toLowerCase().includes(q))
  }, [revisiList, searchQuery])

  const perluRevisi = revisiList.filter((r) => r.status === 'Perlu Revisi').length
  const terkirim = revisiList.filter((r) => r.status === 'Revisi Terkirim').length
  const disetujui = revisiList.filter((r) => r.status === 'Revisi Disetujui').length
  const selected = revisiList.find((r) => r.id === selectedId) ?? null

  function updatePerbaikan(id: number, perbaikan: string) {
    setRevisiList((prev) => prev.map((r) => (r.id === id ? { ...r, perbaikan } : r)))
  }

  function simpanSementara(id: number) {
    setRevisiList((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Perlu Revisi' } : r)))
  }

  function kirimUlang(id: number) {
    setRevisiList((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Revisi Terkirim' } : r)))
  }

  return (
    <AuditorShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari Item Revisi">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Revisi KKA &amp; Temuan</h1>
        <p className="mt-1 text-sm text-slate-500">Perbaikan data KKA dan temuan yang dikembalikan Ketua Tim atau Pengawas Tim.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Item Perlu Revisi" value={perluRevisi} subtitle="Dari Ketua Tim & Pengawas Tim" icon={AlertTriangle} badge={perluRevisi > 0 ? 'Pending' : undefined} />
        <StatCard label="Revisi Terkirim" value={terkirim} subtitle="Menunggu Reviu Ulang" icon={Send} />
        <StatCard label="Revisi Disetujui" value={disetujui} subtitle="Bulan Ini" icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Item Dikembalikan untuk Revisi</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu item untuk memperbaiki datanya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[0.8fr_0.9fr_1.6fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Item</span>
          <span>Diminta Oleh</span>
          <span>Catatan</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredRevisi.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada item revisi yang cocok.
            </div>
          )}
          {filteredRevisi.map((r) => (
            <div
              key={r.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[0.8fr_0.9fr_1.6fr_1fr_auto] ${selectedId === r.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{r.item}</div>
              <div className="truncate text-slate-600">{r.dimintaOleh}</div>
              <div className="min-w-0 truncate text-slate-600">{r.catatan}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditorStatusBadgeClass(r.status)}`}>
                {r.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 sm:justify-self-end"
              >
                Perbaiki
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        {!selected ? (
          <p className="text-sm text-slate-500">Pilih salah satu item di atas untuk memperbaiki datanya.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Perbaikan Data &ndash; {selected.item}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditorStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                Catatan Revisi dari {selected.dimintaOleh} (baca saja)
              </label>
              <p className="mt-1.5 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-sm">{selected.catatan}</p>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Perbaikan Data KKA / KKPT</label>
              <textarea
                value={selected.perbaikan}
                onChange={(e) => updatePerbaikan(selected.id, e.target.value)}
                disabled={selected.status === 'Revisi Disetujui'}
                rows={4}
                placeholder="Tuliskan perbaikan data sesuai catatan revisi di atas"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={selected.status === 'Revisi Disetujui'}
                onClick={() => simpanSementara(selected.id)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                Simpan Sementara
              </button>
              <button
                type="button"
                disabled={!selected.perbaikan.trim() || selected.status === 'Revisi Disetujui'}
                onClick={() => kirimUlang(selected.id)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Kirim Ulang ke {selected.dimintaOleh}
              </button>
            </div>
          </>
        )}
      </section>
    </AuditorShell>
  )
}
