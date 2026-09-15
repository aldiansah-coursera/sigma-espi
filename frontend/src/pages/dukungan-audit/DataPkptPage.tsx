import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Send,
  Stamp,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { DukunganAuditShell } from '../../components/dukungan-audit/DukunganAuditShell'
import { dukunganAuditStatusBadgeClass } from '../../components/dukungan-audit/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../context/useAuth'
import { extractErrorMessage } from '../../lib/api'
import { DUKUNGAN_AUDIT_ROLE_CODE } from '../../lib/roles'
import type { ObjekPengawasanInput, PkptItem } from '../../services/dukunganAuditService'
import {
  PRIORITAS_RISIKO_OPTIONS,
  ajukanPkpt,
  createPkpt,
  getPkptFileBlob,
  getPkptList,
  getUnitOptions,
  hapusPkptDraft,
  hapusPkptFile,
  terbitkanPkpt,
  uploadPkptFile,
} from '../../services/dukunganAuditService'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function validatePdfFile(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Berkas wajib berformat PDF.'
  if (file.size > MAX_FILE_SIZE) return 'Ukuran berkas maksimal 10MB.'
  return null
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

function emptyObjekRow(defaultUnit: string): ObjekPengawasanInput {
  return { unitKerja: defaultUnit, jenisPengawasan: '', prioritasRisiko: 'Sedang' }
}

/**
 * Tahap 05 flowmap SIGMA v3.0 -- Dukungan Audit "Menyediakan & Mengelola
 * Data PKPT". Di sini draf PKPT disusun lalu diajukan ke Kepala SPI; setelah
 * Kepala SPI memeriksa & mengesahkan, Dukungan Audit yang menerbitkannya.
 */
export function DataPkptPage() {
  const { user } = useAuth()
  const isKoordinator = user?.role === DUKUNGAN_AUDIT_ROLE_CODE

  const [pkptList, setPkptList] = useState<PkptItem[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [tahunAnggaran, setTahunAnggaran] = useState(String(new Date().getFullYear()))
  const [namaPkpt, setNamaPkpt] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [objekRows, setObjekRows] = useState<ObjekPengawasanInput[]>([])
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [fileBusyId, setFileBusyId] = useState<number | null>(null)
  const [uploadRowId, setUploadRowId] = useState<number | null>(null)
  const rowFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      const [pkpt, unitList] = await Promise.all([getPkptList(), getUnitOptions()])
      if (cancelled) return
      setPkptList(pkpt)
      setUnits(unitList)
      setIsLoading(false)
    }
    void loadAll()
    const interval = setInterval(() => {
      void getPkptList().then((pkpt) => {
        if (!cancelled) setPkptList(pkpt)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  async function refresh() {
    setPkptList(await getPkptList())
  }

  const filteredPkpt = useMemo(
    () => pkptList.filter((p) => matchesQuery(searchQuery, p.namaPkpt, p.status, String(p.tahunAnggaran))),
    [pkptList, searchQuery],
  )

  const draftCount = pkptList.filter((p) => p.status === 'Draft').length
  const menungguCount = pkptList.filter((p) => p.status === 'Diajukan' || p.status === 'Checked').length
  const siapTerbitCount = pkptList.filter((p) => p.status === 'Approved').length

  function openForm() {
    setFormError('')
    setTahunAnggaran(String(new Date().getFullYear()))
    setNamaPkpt('')
    setTanggalMulai('')
    setTanggalSelesai('')
    setObjekRows([emptyObjekRow(units[0] ?? '')])
    setBuktiFile(null)
    setShowForm(true)
  }

  function handleCreateFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const err = validatePdfFile(file)
    if (err) {
      setFormError(err)
      return
    }
    setFormError('')
    setBuktiFile(file)
  }

  function updateObjekRow(index: number, patch: Partial<ObjekPengawasanInput>) {
    setObjekRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function submitDraft() {
    if (!namaPkpt.trim()) {
      setFormError('Nama PKPT wajib diisi.')
      return
    }
    if (!tanggalMulai || !tanggalSelesai) {
      setFormError('Periode PKPT (tanggal mulai & selesai) wajib diisi.')
      return
    }
    if (tanggalSelesai < tanggalMulai) {
      setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }
    const objekValid = objekRows.filter((o) => o.unitKerja && o.jenisPengawasan.trim())
    if (objekValid.length === 0) {
      setFormError('Minimal 1 objek pengawasan (unit kerja + jenis pengawasan) wajib diisi.')
      return
    }

    setFormError('')
    setIsSaving(true)
    try {
      const created = await createPkpt({
        tahunAnggaran: Number(tahunAnggaran),
        namaPkpt: namaPkpt.trim(),
        tanggalMulai,
        tanggalSelesai,
        objekPengawasan: objekValid.map((o) => ({ ...o, jenisPengawasan: o.jenisPengawasan.trim() })),
      })
      if (buktiFile) {
        try {
          await uploadPkptFile(created.pkptId, buktiFile)
        } catch (err) {
          window.alert(
            extractErrorMessage(err, 'Draf PKPT tersimpan, tapi gagal mengunggah berkas PDF. Coba unggah lagi dari daftar PKPT.'),
          )
        }
      }
      await refresh()
      setShowForm(false)
      setBuktiFile(null)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Gagal menyimpan draf PKPT.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function runAction(id: number, action: (id: number) => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action(id)
      await refresh()
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleHapus(p: PkptItem) {
    if (!window.confirm(`Hapus draf PKPT "${p.namaPkpt}"?`)) return
    await runAction(p.pkptId, hapusPkptDraft, 'Gagal menghapus draf PKPT.')
  }

  function triggerRowUpload(id: number) {
    setUploadRowId(id)
    rowFileInputRef.current?.click()
  }

  async function handleRowFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const targetId = uploadRowId
    setUploadRowId(null)
    if (!file || targetId == null) return
    const err = validatePdfFile(file)
    if (err) {
      window.alert(err)
      return
    }
    setFileBusyId(targetId)
    try {
      await uploadPkptFile(targetId, file)
      await refresh()
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal mengunggah berkas PDF.'))
    } finally {
      setFileBusyId(null)
    }
  }

  async function handleLihatFile(id: number) {
    const win = window.open('', '_blank')
    try {
      const blob = await getPkptFileBlob(id)
      const url = URL.createObjectURL(blob)
      if (win) {
        win.location.href = url
      } else {
        window.open(url, '_blank')
      }
    } catch (err) {
      win?.close()
      window.alert(extractErrorMessage(err, 'Gagal membuka berkas PDF.'))
    }
  }

  async function handleHapusFile(p: PkptItem) {
    if (!window.confirm('Hapus berkas PDF ini?')) return
    setFileBusyId(p.pkptId)
    try {
      await hapusPkptFile(p.pkptId)
      await refresh()
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal menghapus berkas PDF.'))
    } finally {
      setFileBusyId(null)
    }
  }

  return (
    <DukunganAuditShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nama PKPT atau tahun"
    >
      <input
        ref={rowFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => void handleRowFileChange(e)}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Data PKPT (Rencana Tahunan)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Susun draf Program Kerja Pengawasan Tahunan, ajukan ke Kepala SPI, lalu terbitkan setelah disahkan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Susun Draf PKPT'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Draf Belum Diajukan" value={draftCount} icon={ClipboardList} badge={draftCount > 0 ? 'Draft' : undefined} />
        <StatCard label="Menunggu Kepala SPI" value={menungguCount} icon={CalendarRange} />
        <StatCard label="Siap Diterbitkan" value={siapTerbitCount} icon={Stamp} badge={siapTerbitCount > 0 ? 'Terbitkan' : undefined} />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Susun Draf PKPT</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Draf berstatus &quot;Draft&quot; sampai Anda mengajukannya ke Kepala SPI.
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tahun Anggaran</label>
                <input
                  type="number"
                  value={tahunAnggaran}
                  onChange={(e) => setTahunAnggaran(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Nama PKPT</label>
                <input
                  type="text"
                  value={namaPkpt}
                  onChange={(e) => setNamaPkpt(e.target.value)}
                  placeholder="mis. PKPT Tahun Anggaran 2026"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Periode Mulai</label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Periode Selesai</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                  Objek Pengawasan
                </label>
                <button
                  type="button"
                  onClick={() => setObjekRows((prev) => [...prev, emptyObjekRow(units[0] ?? '')])}
                  className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                  <Plus size={13} />
                  Tambah Objek
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {objekRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.3fr_0.8fr_auto]">
                    <select
                      value={row.unitKerja}
                      onChange={(e) => updateObjekRow(index, { unitKerja: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
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
                      placeholder="Jenis pengawasan"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <select
                      value={row.prioritasRisiko}
                      onChange={(e) => updateObjekRow(index, { prioritasRisiko: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {PRIORITAS_RISIKO_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setObjekRows((prev) => prev.filter((_, i) => i !== index))}
                      title="Hapus baris"
                      className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                Berkas Pendukung (PDF, opsional)
              </label>
              <label
                htmlFor="pkpt-bukti-input"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 py-6 text-center hover:border-blue-400"
              >
                <UploadCloud size={22} className="text-blue-400" />
                <span className="text-sm font-semibold text-blue-700">
                  {buktiFile ? buktiFile.name : 'Klik untuk memilih berkas PDF'}
                </span>
                <span className="text-xs text-slate-400">Hanya file PDF, maksimal 10MB</span>
                <input
                  id="pkpt-bukti-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleCreateFileChange}
                  className="hidden"
                />
              </label>
            </div>
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
              onClick={() => void submitDraft()}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar PKPT</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh PKPT beserta status persetujuannya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_0.6fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nama PKPT</span>
          <span>Tahun</span>
          <span>Periode</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredPkpt.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada PKPT yang cocok.
            </div>
          )}
          {filteredPkpt.map((p) => {
            const isExpanded = expandedId === p.pkptId
            const isBusy = busyId === p.pkptId
            return (
              <div key={p.pkptId} className="rounded-2xl bg-white shadow-sm">
                <div className="grid w-full min-w-0 grid-cols-1 items-center gap-3 px-5 py-4 sm:grid-cols-[1.4fr_0.6fr_1fr_0.8fr_auto] sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : p.pkptId)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className="truncate font-semibold text-slate-800">{p.namaPkpt}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                  <div className="truncate text-slate-600">{p.tahunAnggaran}</div>
                  <div className="truncate text-xs text-slate-500">
                    {p.tanggalMulai} s/d {p.tanggalSelesai}
                  </div>
                  <div>
                    <span
                      className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${dukunganAuditStatusBadgeClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {p.status === 'Draft' && (
                      <>
                        {isKoordinator && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void runAction(p.pkptId, ajukanPkpt, 'Gagal mengajukan PKPT.')}
                            className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send size={13} />
                            Ajukan
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleHapus(p)}
                          title="Hapus draf"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    {p.status === 'Approved' && isKoordinator && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void runAction(p.pkptId, terbitkanPkpt, 'Gagal menerbitkan PKPT.')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Stamp size={13} />
                        Terbitkan
                      </button>
                    )}
                  </div>
                </div>

                {p.catatanRevisi && p.status === 'Draft' && (
                  <p className="px-5 pb-3 text-xs font-semibold text-amber-700">
                    Catatan Kepala SPI: {p.catatanRevisi}
                  </p>
                )}

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Disusun Oleh</div>
                        <div className="mt-1 text-sm text-slate-700">{p.dibuatOleh ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Disahkan Oleh</div>
                        <div className="mt-1 text-sm text-slate-700">{p.disahkanOleh ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Diterbitkan</div>
                        <div className="mt-1 text-sm text-slate-700">
                          {p.diterbitkanOleh ? `${p.diterbitkanOleh} (${p.tanggalTerbit ?? '-'})` : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Berkas Pendukung (PDF)
                      </div>
                      {p.fileBuktiNama ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                            <FileText size={15} className="shrink-0 text-blue-500" />
                            <span className="truncate">{p.fileBuktiNama}</span>
                            <span className="shrink-0 text-xs text-slate-400">({formatFileSize(p.fileBuktiUkuran)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleLihatFile(p.pkptId)}
                              className="flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                            >
                              <Eye size={12} />
                              Lihat
                            </button>
                            {p.status === 'Draft' && (
                              <>
                                <button
                                  type="button"
                                  disabled={fileBusyId === p.pkptId}
                                  onClick={() => triggerRowUpload(p.pkptId)}
                                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Ganti
                                </button>
                                <button
                                  type="button"
                                  disabled={fileBusyId === p.pkptId}
                                  onClick={() => void handleHapusFile(p)}
                                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : p.status === 'Draft' ? (
                        <button
                          type="button"
                          disabled={fileBusyId === p.pkptId}
                          onClick={() => triggerRowUpload(p.pkptId)}
                          className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <UploadCloud size={13} />
                          Unggah Berkas PDF
                        </button>
                      ) : (
                        <div className="mt-1 text-sm text-slate-400">Tidak ada berkas.</div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Objek Pengawasan ({p.totalObjek})
                      </div>
                      <div className="mt-2 space-y-2">
                        {p.objekPengawasan.map((o) => (
                          <div
                            key={o.objekId}
                            className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm sm:grid-cols-[1fr_1.3fr_0.6fr]"
                          >
                            <span className="truncate text-slate-700">{o.unitKerja}</span>
                            <span className="truncate text-slate-600">{o.jenisPengawasan}</span>
                            <span className="truncate text-xs text-slate-500">Risiko: {o.prioritasRisiko}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </DukunganAuditShell>
  )
}
