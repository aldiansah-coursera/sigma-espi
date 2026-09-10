import { useMemo, useState } from 'react'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { JaminanKualitasShell } from '../../components/jaminan-kualitas/JaminanKualitasShell'
import { qaStatusBadgeClass } from '../../components/jaminan-kualitas/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface ChecksState {
  kesesuaianStandar: boolean
  kecukupanBukti: boolean
  konsistensiProsedur: boolean
}

interface Metodologi {
  id: number
  noPka: string
  ketuaTim: string
  ringkasan: string
  status: string
  catatan: string
  checks: ChecksState
}

// Data contoh (statis) -- reviu kesesuaian metodologi PKA & KKA dengan
// standar audit internal sebelum diteruskan ke tahap validasi mutu LHA.
// Sisi backend belum dibangun; status checklist dan keputusan dikelola
// secara lokal.
const INITIAL_METODOLOGI: Metodologi[] = [
  {
    id: 1,
    noPka: 'PKA/041/001',
    ketuaTim: 'Ahmad Fauzi',
    ringkasan:
      'PKA mencakup 5 langkah kerja pengujian mesin dengan alokasi 5 hari kerja. KKA memuat 3 temuan dengan bukti observasi dan dokumentasi foto.',
    status: 'Menunggu Reviu',
    catatan: '',
    checks: { kesesuaianStandar: false, kecukupanBukti: false, konsistensiProsedur: false },
  },
  {
    id: 2,
    noPka: 'PKA/041/002',
    ketuaTim: 'Budi Santoso',
    ringkasan:
      'PKA mencakup 4 langkah kerja reviu pengadaan dengan alokasi 3 hari kerja. KKA memuat 1 temuan keterlambatan SLA dengan bukti dokumen kontrak.',
    status: 'Selesai',
    catatan: 'Metodologi sudah sesuai standar audit internal, dapat dilanjutkan ke penyusunan LHA.',
    checks: { kesesuaianStandar: true, kecukupanBukti: true, konsistensiProsedur: true },
  },
]

export function ReviuMetodologiPage() {
  const [metodologiList, setMetodologiList] = useState<Metodologi[]>(INITIAL_METODOLOGI)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(INITIAL_METODOLOGI[0]?.id ?? null)

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return metodologiList
    return metodologiList.filter((m) => m.noPka.toLowerCase().includes(q) || m.ketuaTim.toLowerCase().includes(q))
  }, [metodologiList, searchQuery])

  const menunggu = metodologiList.filter((m) => m.status === 'Menunggu Reviu').length
  const selesai = metodologiList.filter((m) => m.status === 'Selesai').length
  const selected = metodologiList.find((m) => m.id === selectedId) ?? null
  const allChecked = selected ? selected.checks.kesesuaianStandar && selected.checks.kecukupanBukti && selected.checks.konsistensiProsedur : false

  function updateCatatan(id: number, catatan: string) {
    setMetodologiList((prev) => prev.map((m) => (m.id === id ? { ...m, catatan } : m)))
  }

  function toggleCheck(id: number, key: keyof ChecksState) {
    setMetodologiList((prev) => prev.map((m) => (m.id === id ? { ...m, checks: { ...m.checks, [key]: !m.checks[key] } } : m)))
  }

  function selesaiReviu(id: number) {
    setMetodologiList((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'Selesai' } : m)))
  }

  return (
    <JaminanKualitasShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari No. PKA atau ketua tim">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Reviu Metodologi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Menilai kesesuaian metodologi PKA &amp; KKA dengan standar audit internal sebelum LHA disusun.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Antrean" value={metodologiList.length} icon={ListChecks} />
        <StatCard label="Menunggu Reviu" value={menunggu} icon={ListChecks} badge={menunggu > 0 ? 'Pending' : undefined} />
        <StatCard label="Selesai Direviu" value={selesai} icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Metodologi</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pilih salah satu untuk melakukan reviu.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.2fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. PKA</span>
          <span>Ketua Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredList.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada metodologi yang cocok.
            </div>
          )}
          {filteredList.map((m) => (
            <div
              key={m.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 sm:grid-cols-[1fr_1.2fr_1fr_auto] ${selectedId === m.id ? 'ring-blue-400' : 'ring-transparent'}`}
            >
              <div className="truncate font-semibold text-blue-700">{m.noPka}</div>
              <div className="truncate text-slate-600">{m.ketuaTim}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${qaStatusBadgeClass(m.status)}`}>
                {m.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(m.id)}
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
          <p className="text-sm text-slate-500">Pilih salah satu metodologi di atas untuk memulai reviu.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">Reviu Metodologi &ndash; {selected.noPka}</h2>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${qaStatusBadgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ringkasan PKA &amp; KKA</p>
              <p className="mt-1.5 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-sm">{selected.ringkasan}</p>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.checks.kesesuaianStandar}
                  onChange={() => toggleCheck(selected.id, 'kesesuaianStandar')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-400"
                />
                Kesesuaian dengan Standar Audit
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.checks.kecukupanBukti}
                  onChange={() => toggleCheck(selected.id, 'kecukupanBukti')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-400"
                />
                Kecukupan Bukti Pendukung
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.checks.konsistensiProsedur}
                  onChange={() => toggleCheck(selected.id, 'konsistensiProsedur')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-400"
                />
                Konsistensi Prosedur Kerja
              </label>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Catatan Reviu</label>
              <textarea
                value={selected.catatan}
                onChange={(e) => updateCatatan(selected.id, e.target.value)}
                rows={3}
                placeholder="Tuliskan catatan hasil reviu"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5">
              <button
                type="button"
                disabled={!allChecked || selected.status === 'Selesai'}
                onClick={() => selesaiReviu(selected.id)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Selesai Reviu
              </button>
              {!allChecked && selected.status !== 'Selesai' && (
                <p className="mt-2 text-xs text-slate-400">Centang ketiga poin checklist untuk menyelesaikan reviu.</p>
              )}
            </div>
          </>
        )}
      </section>
    </JaminanKualitasShell>
  )
}
