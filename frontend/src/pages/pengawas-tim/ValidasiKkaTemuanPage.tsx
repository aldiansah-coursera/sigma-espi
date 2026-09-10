import { useMemo, useState } from 'react'
import { Lock, RotateCcw, ShieldCheck } from 'lucide-react'
import { PengawasTimShell } from '../../components/pengawas-tim/PengawasTimShell'
import { pengawasStatusBadgeClass } from '../../components/pengawas-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface KkaTemuan {
  id: number
  noKka: string
  ketuaTim: string
  prosedurBukti: string
  kondisi: string
  kriteria: string
  penyebab: string
  akibat: string
  status: string
  catatan: string
}

// Data contoh (statis) -- gerbang validasi Kertas Kerja Audit (KKA) dan
// temuan oleh Pengawas Tim sebelum data dikunci dan diteruskan ke Jaminan
// Kualitas. Sisi backend belum dibangun.
const INITIAL_KKA: KkaTemuan[] = [
  {
    id: 1,
    noKka: 'KKA/041/001',
    ketuaTim: 'Ahmad Fauzi',
    prosedurBukti:
      'Observasi lapangan pada 12 Agustus 2026, dilengkapi foto dokumentasi checklist inspeksi mesin dan salinan log perawatan 6 bulan terakhir.',
    kondisi: 'Ditemukan 3 dari 10 unit mesin belum menjalani perawatan berkala sesuai jadwal.',
    kriteria: 'SOP Perawatan Mesin No. 04/SOP/2024 mewajibkan perawatan setiap 500 jam operasi.',
    penyebab: 'Keterlambatan pengadaan suku cadang pengganti dari vendor.',
    akibat: 'Risiko penurunan keandalan mesin dan potensi downtime produksi.',
    status: 'Menunggu Validasi',
    catatan: '',
  },
  {
    id: 2,
    noKka: 'KKA/041/002',
    ketuaTim: 'Budi Santoso',
    prosedurBukti: 'Reviu dokumen kontrak dan wawancara dengan tim pengadaan pada 15 Agustus 2026.',
    kondisi: 'Proses pengadaan suku cadang kritis melebihi Standar Waktu Layanan (SLA) internal.',
    kriteria: 'Pedoman Pengadaan Barang/Jasa mensyaratkan proses selesai dalam 14 hari kerja.',
    penyebab: 'Belum ada eskalasi otomatis saat SLA terlampaui.',
    akibat: 'Potensi keterlambatan jadwal produksi.',
    status: 'Valid',
    catatan: 'Bukti pendukung lengkap, data dikunci untuk diteruskan ke Jaminan Kualitas.',
  },
]

export function ValidasiKkaTemuanPage() {
  const [kkaList, setKkaList] = useState<KkaTemuan[]>(INITIAL_KKA)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_KKA[0]?.id ?? null)

  const filteredKka = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return kkaList
    return kkaList.filter((k) => k.noKka.toLowerCase().includes(q) || k.ketuaTim.toLowerCase().includes(q))
  }, [kkaList, searchQuery])

  const menunggu = kkaList.filter((k) => k.status === 'Menunggu Validasi').length
  const valid = kkaList.filter((k) => k.status === 'Valid').length
  const selected = kkaList.find((k) => k.id === selectedId) ?? null

  function updateCatatan(id: number, catatan: string) {
    setKkaList((prev) => prev.map((k) => (k.id === id ? { ...k, catatan } : k)))
  }

  function setKeputusan(id: number, status: string) {
    setKkaList((prev) => prev.map((k) => (k.id === id ? { ...k, status } : k)))
  }

  return (
    <PengawasTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. KKA atau ketua tim">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Validasi KKA &amp; Temuan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Memvalidasi kecukupan prosedur, bukti, dan kondisi-kriteria-penyebab-akibat sebelum data dikunci.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total KKA & Temuan" value={kkaList.length} icon={ShieldCheck} />
        <StatCard label="Menunggu Validasi" value={menunggu} icon={RotateCcw} badge={menunggu > 0 ? 'Pending' : undefined} />
        <StatCard label="Valid & Terkunci" value={valid} icon={Lock} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar KKA &amp; Temuan</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu untuk meninjau kelengkapan bukti.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.2fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. KKA</span>
          <span>Ketua Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredKka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada KKA yang cocok.
            </div>
          )}
          {filteredKka.map((k) => (
            <div
              key={k.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[1fr_1.2fr_1fr_auto] ${selectedId === k.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{k.noKka}</div>
              <div className="truncate text-slate-600">{k.ketuaTim}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(k.status)}`}>
                {k.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(k.id)}
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
          <p className="text-sm text-slate-500">Pilih salah satu KKA di atas untuk melihat detail validasi.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Detail Validasi &ndash; {selected.noKka}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Prosedur &amp; Bukti Audit</p>
              <p className="mt-1.5 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-sm">{selected.prosedurBukti}</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Kondisi</p>
                <p className="mt-1 text-sm text-slate-600">{selected.kondisi}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Kriteria</p>
                <p className="mt-1 text-sm text-slate-600">{selected.kriteria}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Penyebab</p>
                <p className="mt-1 text-sm text-slate-600">{selected.penyebab}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Akibat</p>
                <p className="mt-1 text-sm text-slate-600">{selected.akibat}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Catatan</label>
              <textarea
                value={selected.catatan}
                onChange={(e) => updateCatatan(selected.id, e.target.value)}
                disabled={selected.status === 'Valid'}
                rows={3}
                placeholder="Tuliskan catatan kekurangan bukti (jika ada)"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={selected.status === 'Valid'}
                onClick={() => setKeputusan(selected.id, 'Revisi')}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Ada Catatan &ndash; Kirim Ulang
              </button>
              <button
                type="button"
                disabled={selected.status === 'Valid'}
                onClick={() => setKeputusan(selected.id, 'Valid')}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lock size={16} />
                Valid &ndash; Kunci Data
              </button>
            </div>
          </>
        )}
      </section>
    </PengawasTimShell>
  )
}
