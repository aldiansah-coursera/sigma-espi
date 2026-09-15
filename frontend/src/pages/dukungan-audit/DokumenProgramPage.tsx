import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileStack,
  FileText,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { DukunganAuditShell } from '../../components/dukungan-audit/DukunganAuditShell'
import { dukunganAuditStatusBadgeClass } from '../../components/dukungan-audit/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../context/useAuth'
import { extractErrorMessage } from '../../lib/api'
import { DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE } from '../../lib/roles'
import type { DokumenProgram } from '../../services/dukunganAuditService'
import {
  ajukanDokumen,
  createDokumen,
  getDokumenFileBlob,
  getDokumenList,
  hapusDokumenFile,
  uploadDokumenFile,
} from '../../services/dukunganAuditService'

const KATEGORI_OPTIONS = ['Regulasi', 'Template Kerja', 'Pedoman Audit', 'Checklist Program']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

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

export function DokumenProgramPage() {
  const { user } = useAuth()
  const isKoordinator = user?.role === DUKUNGAN_AUDIT_ROLE_CODE
  const isStaff = user?.role === DUKUNGAN_AUDIT_STAFF_ROLE_CODE

  const [dokumenList, setDokumenList] = useState<DokumenProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [ajukanBusyId, setAjukanBusyId] = useState<number | null>(null)
  const [ajukanErrorId, setAjukanErrorId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0])
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [fileBusyId, setFileBusyId] = useState<number | null>(null)
  const [uploadRowId, setUploadRowId] = useState<number | null>(null)
  const rowFileInputRef = useRef<HTMLInputElement>(null)

  function load() {
    return getDokumenList().then((data) => {
      setDokumenList(data)
      setIsLoading(false)
    })
  }

  useEffect(() => {
    let cancelled = false
    load()
    const interval = setInterval(() => {
      if (!cancelled) void load()
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredDokumen = useMemo(
    () => dokumenList.filter((d) => matchesQuery(searchQuery, d.judul, d.kategori, d.status)),
    [dokumenList, searchQuery],
  )

  function openForm() {
    setFormError('')
    setJudul('')
    setKategori(KATEGORI_OPTIONS[0])
    setBuktiFile(null)
    setShowForm(true)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
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
      await uploadDokumenFile(targetId, file)
      await load()
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal mengunggah berkas PDF.'))
    } finally {
      setFileBusyId(null)
    }
  }

  async function handleLihatFile(id: number) {
    const win = window.open('', '_blank')
    try {
      const blob = await getDokumenFileBlob(id)
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

  async function handleHapusFile(d: DokumenProgram) {
    if (!window.confirm('Hapus berkas PDF ini?')) return
    setFileBusyId(d.regulasiId)
    try {
      await hapusDokumenFile(d.regulasiId)
      await load()
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal menghapus berkas PDF.'))
    } finally {
      setFileBusyId(null)
    }
  }

  async function handleAjukan(id: number) {
    setAjukanErrorId(null)
    setAjukanBusyId(id)
    try {
      await ajukanDokumen(id)
      await load()
    } catch {
      setAjukanErrorId(id)
    } finally {
      setAjukanBusyId(null)
    }
  }

  async function submitDokumen() {
    if (!judul.trim()) {
      setFormError('Judul dokumen wajib diisi.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      const created = await createDokumen({ judul: judul.trim(), kategori })
      if (buktiFile) {
        try {
          await uploadDokumenFile(created.regulasiId, buktiFile)
        } catch (err) {
          window.alert(
            extractErrorMessage(err, 'Draf dokumen tersimpan, tapi gagal mengunggah berkas PDF. Coba unggah lagi dari daftar dokumen.'),
          )
        }
      }
      await load()
      setShowForm(false)
      setBuktiFile(null)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Gagal menyimpan draf dokumen. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DukunganAuditShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari judul atau kategori dokumen">
      <input
        ref={rowFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => void handleRowFileChange(e)}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dokumen Program</h1>
          <p className="mt-1 text-sm text-slate-500">
            Susun draf Dokumen Program (DOK PROG) untuk diperiksa dan disetujui Kepala SPI.
          </p>
        </div>
        {isStaff && (
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openForm())}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Batal' : 'Buat Draf Baru'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Dokumen Program" value={dokumenList.length} icon={FileStack} />
        <StatCard label="Draf" value={dokumenList.filter((d) => d.status === 'Draft').length} subtitle="Belum diajukan koordinator" />
        <StatCard label="Disetujui" value={dokumenList.filter((d) => d.status === 'Approved').length} />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Buat Draf Dokumen Program</h2>
          <p className="mt-0.5 text-sm text-slate-500">Draf akan berstatus "Draft" sampai diperiksa Kepala SPI.</p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Judul Dokumen</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="mis. Program Audit Kepatuhan Pengadaan 2026"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">File Dokumen (PDF, opsional)</label>
              <label
                htmlFor="dokumen-program-input"
                className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 hover:border-blue-300"
              >
                <UploadCloud size={18} className="text-blue-600" />
                {buktiFile ? buktiFile.name : 'Pilih file PDF...'}
              </label>
              <input id="dokumen-program-input" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
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
              onClick={() => void submitDokumen()}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Dokumen Program</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh dokumen program yang telah Anda susun.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Judul</span>
          <span>Kategori</span>
          <span>Direview Oleh</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredDokumen.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada dokumen program yang cocok.
            </div>
          )}
          {filteredDokumen.map((d) => {
            const isExpanded = expandedId === d.regulasiId
            const isAjukanBusy = ajukanBusyId === d.regulasiId
            const canAjukan = isKoordinator && d.status === 'Draft'
            return (
              <div key={d.regulasiId} className="rounded-2xl bg-white shadow-sm">
                <div className="grid w-full min-w-0 grid-cols-2 items-center gap-4 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : d.regulasiId)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className="truncate font-semibold text-slate-800">{d.judul}</span>
                    {isExpanded ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
                  </button>
                  <div className="truncate text-slate-600">{d.kategori}</div>
                  <div className="truncate text-slate-600">{d.direviewOleh ?? '-'}</div>
                  <div>
                    <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${dukunganAuditStatusBadgeClass(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {canAjukan && (
                      <button
                        type="button"
                        disabled={isAjukanBusy}
                        onClick={() => void handleAjukan(d.regulasiId)}
                        className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={13} />
                        Ajukan
                      </button>
                    )}
                  </div>
                </div>

                {ajukanErrorId === d.regulasiId && (
                  <p className="px-5 pb-3 text-xs font-semibold text-red-600">Gagal mengajukan dokumen. Silakan coba lagi.</p>
                )}

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Dibuat Oleh</div>
                        <div className="mt-1 text-sm text-slate-700">{d.dibuatOleh ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Dibuat Pada</div>
                        <div className="mt-1 text-sm text-slate-700">{d.createdAt ? d.createdAt.slice(0, 10) : '-'}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Berkas Pendukung (PDF)
                      </div>
                      {d.fileBuktiNama ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                            <FileText size={15} className="shrink-0 text-blue-500" />
                            <span className="truncate">{d.fileBuktiNama}</span>
                            <span className="shrink-0 text-xs text-slate-400">({formatFileSize(d.fileBuktiUkuran)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleLihatFile(d.regulasiId)}
                              className="flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                            >
                              <Eye size={12} />
                              Lihat
                            </button>
                            {isStaff && d.status === 'Draft' && (
                              <>
                                <button
                                  type="button"
                                  disabled={fileBusyId === d.regulasiId}
                                  onClick={() => triggerRowUpload(d.regulasiId)}
                                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Ganti
                                </button>
                                <button
                                  type="button"
                                  disabled={fileBusyId === d.regulasiId}
                                  onClick={() => void handleHapusFile(d)}
                                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : isStaff && d.status === 'Draft' ? (
                        <button
                          type="button"
                          disabled={fileBusyId === d.regulasiId}
                          onClick={() => triggerRowUpload(d.regulasiId)}
                          className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <UploadCloud size={13} />
                          Unggah Berkas PDF
                        </button>
                      ) : (
                        <div className="mt-1 text-sm text-slate-400">Tidak ada berkas.</div>
                      )}
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
