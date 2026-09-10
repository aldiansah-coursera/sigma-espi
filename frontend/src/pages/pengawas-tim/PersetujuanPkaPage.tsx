import { useMemo, useState } from 'react'
import { Check, ClipboardCheck, Clock, RotateCcw } from 'lucide-react'
import { PengawasTimShell } from '../../components/pengawas-tim/PengawasTimShell'
import { pengawasStatusBadgeClass } from '../../components/pengawas-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface PkaTinjauan {
  id: number
  noPka: string
  ketuaTim: string
  objekAudit: string
  langkahKerja: string
  alokasiWaktu: string
  status: string
  catatan: string
}

// Data contoh (statis) -- gerbang persetujuan PKA oleh Pengawas Tim sebelum
// pelaksanaan audit lapangan dimulai. Sisi backend belum dibangun; state
// keputusan (setuju/minta revisi) dan catatan dikelola secara lokal.
const INITIAL_PKA: PkaTinjauan[] = [
  {
    id: 1,
    noPka: 'PKA/041/001',
    ketuaTim: 'Ahmad Fauzi',
    objekAudit: 'Pengujian Mesin Hangar 3',
    langkahKerja:
      'Melakukan pemeriksaan dokumen jadwal perawatan mesin, wawancara dengan teknisi penanggung jawab, dan observasi langsung proses pengujian di Hangar 3.',
    alokasiWaktu: '5 hari kerja',
    status: 'Menunggu Persetujuan',
    catatan: '',
  },
  {
    id: 2,
    noPka: 'PKA/041/002',
    ketuaTim: 'Budi Santoso',
    objekAudit: 'Reviu Pengadaan Suku Cadang',
    langkahKerja:
      'Menelaah dokumen kontrak pengadaan, membandingkan harga dengan Harga Perkiraan Sendiri (HPS), dan menguji kelengkapan berita acara serah terima.',
    alokasiWaktu: '3 hari kerja',
    status: 'Menunggu Persetujuan',
    catatan: '',
  },
  {
    id: 3,
    noPka: 'PKA/041/003',
    ketuaTim: 'Siti Rahayu',
    objekAudit: 'Audit Kepatuhan Prosedur K3',
    langkahKerja:
      'Memeriksa kepatuhan penggunaan APD di area produksi dan menguji efektivitas prosedur tanggap darurat melalui simulasi.',
    alokasiWaktu: '4 hari kerja',
    status: 'Disetujui',
    catatan: 'Ruang lingkup sudah sesuai PKPT, disetujui untuk dilaksanakan.',
  },
]

export function PersetujuanPkaPage() {
  const [pkaList, setPkaList] = useState<PkaTinjauan[]>(INITIAL_PKA)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_PKA[0]?.id ?? null)

  const filteredPka = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return pkaList
    return pkaList.filter(
      (p) => p.noPka.toLowerCase().includes(q) || p.ketuaTim.toLowerCase().includes(q) || p.objekAudit.toLowerCase().includes(q),
    )
  }, [pkaList, searchQuery])

  const menunggu = pkaList.filter((p) => p.status === 'Menunggu Persetujuan').length
  const disetujui = pkaList.filter((p) => p.status === 'Disetujui').length
  const selected = pkaList.find((p) => p.id === selectedId) ?? null

  function updateCatatan(id: number, catatan: string) {
    setPkaList((prev) => prev.map((p) => (p.id === id ? { ...p, catatan } : p)))
  }

  function setKeputusan(id: number, status: string) {
    setPkaList((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  return (
    <PengawasTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. PKA atau ketua tim">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Persetujuan PKA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tinjau langkah kerja dan alokasi waktu Program Kerja Audit (PKA) sebelum audit lapangan dimulai.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total PKA" value={pkaList.length} icon={ClipboardCheck} />
        <StatCard label="Menunggu Persetujuan" value={menunggu} icon={Clock} badge={menunggu > 0 ? 'Pending' : undefined} />
        <StatCard label="PKA Disetujui" value={disetujui} icon={Check} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar PKA</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu PKA untuk meninjau detail dan memberi keputusan.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.2fr_1.4fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. PKA</span>
          <span>Ketua Tim</span>
          <span>Objek Audit</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredPka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada PKA yang cocok.
            </div>
          )}
          {filteredPka.map((p) => (
            <div
              key={p.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[1fr_1.2fr_1.4fr_1fr_auto] ${selectedId === p.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{p.noPka}</div>
              <div className="truncate text-slate-600">{p.ketuaTim}</div>
              <div className="min-w-0 truncate text-slate-600">{p.objekAudit}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(p.status)}`}>
                {p.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
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
          <p className="text-sm text-slate-500">Pilih salah satu PKA di atas untuk melihat detail keputusan.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Detail &amp; Keputusan &ndash; {selected.noPka}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Langkah Kerja</p>
                <p className="mt-1.5 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-sm">{selected.langkahKerja}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Alokasi Waktu</p>
                <p className="mt-1.5 rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm">{selected.alokasiWaktu}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Catatan Keputusan</label>
              <textarea
                value={selected.catatan}
                onChange={(e) => updateCatatan(selected.id, e.target.value)}
                rows={3}
                placeholder="Tuliskan catatan atau alasan keputusan (opsional untuk persetujuan, wajib untuk revisi)"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={selected.status === 'Revisi'}
                onClick={() => setKeputusan(selected.id, 'Revisi')}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Minta Revisi
              </button>
              <button
                type="button"
                disabled={selected.status === 'Disetujui'}
                onClick={() => setKeputusan(selected.id, 'Disetujui')}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={16} />
                Setujui PKA
              </button>
            </div>
          </>
        )}
      </section>
    </PengawasTimShell>
  )
}
