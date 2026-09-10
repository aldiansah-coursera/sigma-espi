import { useMemo, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { AuditeeShell } from '../../components/auditee/AuditeeShell'
import { auditeePrioritasBadgeClass, auditeeStatusBadgeClass } from '../../components/auditee/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface TemuanKonfirmasi {
  id: number
  noTemuan: string
  kondisi: string
  kriteria: string
  prioritas: string
  status: string
  klarifikasi: string
  tanggapanAwal: string
}

// Data contoh (statis) -- konfirmasi & tanggapan Auditee atas temuan yang
// diekspos Ketua Tim. Sisi backend belum dibangun; tanggapan disimpan
// secara lokal.
const INITIAL_TEMUAN: TemuanKonfirmasi[] = [
  {
    id: 1,
    noTemuan: 'TM/041/003',
    kondisi: 'Ditemukan 3 dari 10 unit mesin belum menjalani perawatan berkala sesuai jadwal.',
    kriteria: 'SOP Perawatan Mesin No. 04/SOP/2024 mewajibkan perawatan setiap 500 jam operasi.',
    prioritas: 'Tinggi',
    status: 'Menunggu Tanggapan',
    klarifikasi: '',
    tanggapanAwal: '',
  },
  {
    id: 2,
    noTemuan: 'TM/041/004',
    kondisi: 'Dokumentasi simulasi tanggap darurat tidak lengkap untuk periode Q2 2026.',
    kriteria: 'Prosedur K3 mewajibkan simulasi tanggap darurat didokumentasikan setiap triwulan.',
    prioritas: 'Sedang',
    status: 'Dikonfirmasi',
    klarifikasi: 'Simulasi telah dilaksanakan namun dokumentasi belum diunggah ke sistem arsip.',
    tanggapanAwal: 'Kami akan melengkapi dokumentasi paling lambat 2 minggu ke depan.',
  },
]

export function KonfirmasiTemuanPage() {
  const [temuanList, setTemuanList] = useState<TemuanKonfirmasi[]>(INITIAL_TEMUAN)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_TEMUAN[0]?.id ?? null)

  const filteredTemuan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return temuanList
    return temuanList.filter((t) => t.noTemuan.toLowerCase().includes(q))
  }, [temuanList, searchQuery])

  const perluTanggapan = temuanList.filter((t) => t.status === 'Menunggu Tanggapan').length
  const dikonfirmasi = temuanList.filter((t) => t.status === 'Dikonfirmasi').length
  const selected = temuanList.find((t) => t.id === selectedId) ?? null

  function updateField(id: number, field: 'klarifikasi' | 'tanggapanAwal', value: string) {
    setTemuanList((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  function kirimTanggapan(id: number) {
    setTemuanList((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'Dikonfirmasi' } : t)))
  }

  return (
    <AuditeeShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. temuan">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Konfirmasi Temuan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Berikan klarifikasi dan tanggapan awal atas temuan audit yang diekspos oleh Ketua Tim.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Temuan" value={temuanList.length} icon={MessageSquare} />
        <StatCard label="Menunggu Tanggapan" value={perluTanggapan} icon={MessageSquare} badge={perluTanggapan > 0 ? 'Perlu Tindakan' : undefined} />
        <StatCard label="Sudah Dikonfirmasi" value={dikonfirmasi} icon={Send} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Temuan</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu temuan untuk memberikan tanggapan.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1fr_1.2fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. Temuan</span>
          <span>Prioritas</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredTemuan.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada temuan yang cocok.
            </div>
          )}
          {filteredTemuan.map((t) => (
            <div
              key={t.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[1fr_1fr_1.2fr_auto] ${selectedId === t.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{t.noTemuan}</div>
              <span className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${auditeePrioritasBadgeClass(t.prioritas)}`}>
                {t.prioritas}
              </span>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditeeStatusBadgeClass(t.status)}`}>
                {t.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
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
          <p className="text-sm text-slate-500">Pilih salah satu temuan di atas untuk memberikan tanggapan.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Tanggapan &ndash; {selected.noTemuan}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditeeStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
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
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Klarifikasi</label>
              <textarea
                value={selected.klarifikasi}
                onChange={(e) => updateField(selected.id, 'klarifikasi', e.target.value)}
                rows={2}
                placeholder="Jelaskan konteks atau klarifikasi atas temuan ini"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tanggapan Awal</label>
              <textarea
                value={selected.tanggapanAwal}
                onChange={(e) => updateField(selected.id, 'tanggapanAwal', e.target.value)}
                rows={2}
                placeholder="Tuliskan rencana tindak lanjut awal"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5">
              <button
                type="button"
                disabled={!selected.klarifikasi.trim() || !selected.tanggapanAwal.trim()}
                onClick={() => kirimTanggapan(selected.id)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Kirim Tanggapan
              </button>
            </div>
          </>
        )}
      </section>
    </AuditeeShell>
  )
}
