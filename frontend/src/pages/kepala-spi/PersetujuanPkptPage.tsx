import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardCheck, ClipboardList, Clock, Plus, Trash2, X } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import type { ObjekPengawasanInput, Pkpt } from '../../services/kepalaSpiService'
import {
  PRIORITAS_RISIKO_OPTIONS,
  approvePkpt,
  createPkpt,
  getPkptList,
  getUnits,
  rejectPkpt,
} from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

function emptyObjekRow(defaultUnit: string): ObjekPengawasanInput {
  return { unitKerja: defaultUnit, jenisPengawasan: '', prioritasRisiko: 'Sedang' }
}

export function PersetujuanPkptPage() {
  const [pkptList, setPkptList] = useState<Pkpt[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [tahunAnggaran, setTahunAnggaran] = useState('2026')
  const [namaPkpt, setNamaPkpt] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [objekRows, setObjekRows] = useState<ObjekPengawasanInput[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pkpt, unitList] = await Promise.all([getPkptList(), getUnits()])
      if (cancelled) return
      setPkptList(pkpt)
      setUnits(unitList)
      setIsLoading(false)
    }
    void load()
    const interval = setInterval(() => {
      void getPkptList().then((pkpt) => {
        if (cancelled) return
        setPkptList(pkpt)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredPkpt = useMemo(
    () => pkptList.filter((p) => matchesQuery(searchQuery, p.namaPkpt, String(p.tahunAnggaran), p.dibuatOleh)),
    [pkptList, searchQuery],
  )
  const pendingCount = useMemo(() => pkptList.filter((p) => p.status === 'Pending').length, [pkptList])
  const approvedCount = useMemo(() => pkptList.filter((p) => p.status === 'Approved').length, [pkptList])

  function openForm() {
    setFormError('')
    setTahunAnggaran(String(new Date().getFullYear()))
    setNamaPkpt('')
    setTanggalMulai('')
    setTanggalSelesai('')
    setObjekRows([emptyObjekRow(units[0] ?? '')])
    setShowForm(true)
  }

  function addObjekRow() {
    setObjekRows((prev) => [...prev, emptyObjekRow(units[0] ?? '')])
  }

  function removeObjekRow(index: number) {
    setObjekRows((prev) => prev.filter((_, i) => i !== index))
  }

  function updateObjekRow(index: number, patch: Partial<ObjekPengawasanInput>) {
    setObjekRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function submitPkpt() {
    if (!namaPkpt.trim() || !tanggalMulai || !tanggalSelesai || objekRows.length === 0) {
      setFormError('Nama PKPT, periode, dan minimal 1 objek pengawasan wajib diisi.')
      return
    }
    if (objekRows.some((row) => !row.unitKerja || !row.jenisPengawasan.trim())) {
      setFormError('Setiap objek pengawasan wajib memiliki unit kerja dan jenis pengawasan.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      await createPkpt({
        tahunAnggaran: Number(tahunAnggaran),
        namaPkpt: namaPkpt.trim(),
        tanggalMulai,
        tanggalSelesai,
        objekPengawasan: objekRows,
      })
      const refreshed = await getPkptList()
      setPkptList(refreshed)
      setShowForm(false)
    } catch {
      setFormError('Gagal menyimpan PKPT. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApprove(id: number) {
    setBusyId(id)
    try {
      await approvePkpt(id)
      setPkptList((prev) => prev.map((p) => (p.pkptId === id ? { ...p, status: 'Approved' } : p)))
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: number) {
    setBusyId(id)
    try {
      await rejectPkpt(id)
      setPkptList((prev) => prev.map((p) => (p.pkptId === id ? { ...p, status: 'Ditolak' } : p)))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <KepalaSpiShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nama atau tahun PKPT"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Perencanaan &amp; Persetujuan PKPT</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat Program Kerja Pengawasan Tahunan (PKPT) beserta objek pengawasannya, lalu tetapkan status
            persetujuan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Buat PKPT Baru'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total PKPT" value={pkptList.length} icon={ClipboardList} />
        <StatCard
          label="Menunggu Persetujuan"
          value={pendingCount}
          icon={Clock}
          badge={pendingCount > 0 ? 'Pending' : undefined}
        />
        <StatCard label="PKPT Disetujui" value={approvedCount} icon={ClipboardCheck} />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Buat PKPT Baru</h2>
          <p className="mt-0.5 text-sm text-slate-500">Lengkapi data PKPT dan daftar objek pengawasan di dalamnya.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                Tahun Anggaran
              </label>
              <input
                type="number"
                value={tahunAnggaran}
                onChange={(e) => setTahunAnggaran(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Nama PKPT</label>
              <input
                type="text"
                value={namaPkpt}
                onChange={(e) => setNamaPkpt(e.target.value)}
                placeholder="Contoh: PKPT Tahun Anggaran 2026"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tanggal Mulai</label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-950">Objek Pengawasan</h3>
            <button
              type="button"
              onClick={addObjekRow}
              className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
            >
              <Plus size={14} />
              Tambah Objek
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {objekRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-2 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm sm:grid-cols-[1fr_1.4fr_0.8fr_auto]"
              >
                <select
                  value={row.unitKerja}
                  onChange={(e) => updateObjekRow(index, { unitKerja: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Pilih Unit
                  </option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={row.jenisPengawasan}
                  onChange={(e) => updateObjekRow(index, { jenisPengawasan: e.target.value })}
                  placeholder="Jenis pengawasan (contoh: Audit Kepatuhan)"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={row.prioritasRisiko}
                  onChange={(e) => updateObjekRow(index, { prioritasRisiko: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {PRIORITAS_RISIKO_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={objekRows.length === 1}
                  onClick={() => removeObjekRow(index)}
                  title="Hapus objek"
                  className="flex h-8 w-8 items-center justify-center justify-self-end rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void submitPkpt()}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan PKPT'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar PKPT</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh Program Kerja Pengawasan Tahunan yang telah dibuat.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.6fr_0.7fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nama PKPT</span>
          <span>Tahun</span>
          <span>Periode</span>
          <span>Dibuat Oleh</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredPkpt.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada PKPT yang cocok.
            </div>
          )}
          {filteredPkpt.map((p) => (
            <div
              key={p.pkptId}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.6fr_0.7fr_1fr_1fr_0.8fr_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-800">{p.namaPkpt}</div>
                <div className="truncate text-xs text-slate-400">{p.totalObjek} objek pengawasan</div>
              </div>
              <div className="truncate text-slate-600">{p.tahunAnggaran}</div>
              <div className="min-w-0 truncate text-xs text-slate-500">
                {p.tanggalMulai} &ndash; {p.tanggalSelesai}
              </div>
              <div className="truncate text-slate-600">{p.dibuatOleh}</div>
              <span
                className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(p.status)}`}
              >
                {p.status}
              </span>
              <div className="flex gap-2 sm:justify-self-end">
                <button
                  type="button"
                  disabled={p.status === 'Approved' || busyId === p.pkptId}
                  onClick={() => void handleApprove(p.pkptId)}
                  title="Setujui PKPT"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  disabled={p.status === 'Ditolak' || busyId === p.pkptId}
                  onClick={() => void handleReject(p.pkptId)}
                  title="Tolak PKPT"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </KepalaSpiShell>
  )
}
