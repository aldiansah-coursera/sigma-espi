import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ChevronDown, ChevronUp, FileStack, Plus, Send, UploadCloud, X } from 'lucide-react'
import { DukunganAuditShell } from '../../components/dukungan-audit/DukunganAuditShell'
import { dukunganAuditStatusBadgeClass } from '../../components/dukungan-audit/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../context/useAuth'
import { DUKUNGAN_AUDIT_ROLE_CODE } from '../../lib/roles'
import type { DokumenProgram } from '../../services/dukunganAuditService'
import { ajukanDokumen, createDokumen, getDokumenList } from '../../services/dukunganAuditService'

const KATEGORI_OPTIONS = ['Regulasi', 'Template Kerja', 'Pedoman Audit', 'Checklist Program']

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function DokumenProgramPage() {
  const { user } = useAuth()
  const isKoordinator = user?.role === DUKUNGAN_AUDIT_ROLE_CODE

  const [dokumenList, setDokumenList] = useState<DokumenProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [ajukanBusyId, setAjukanBusyId] = useState<number | null>(null)
  const [ajukanErrorId, setAjukanErrorId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0])
  const [fileName, setFileName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

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
    setFileName('')
    setShowForm(true)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setFileName('')
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Dokumen program wajib berupa file PDF.')
      e.target.value = ''
      setFileName('')
      return
    }
    setFormError('')
    setFileName(file.name)
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
      await createDokumen({ judul: judul.trim(), kategori, fileUrl: fileName || undefined })
      await load()
      setShowForm(false)
    } catch {
      setFormError('Gagal menyimpan draf dokumen. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DukunganAuditShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari judul atau kategori dokumen">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dokumen Program</h1>
          <p className="mt-1 text-sm text-slate-500">
            Susun draf Dokumen Program (DOK PROG) untuk diperiksa dan disetujui Kepala SPI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Buat Draf Baru'}
        </button>
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
                {fileName || 'Pilih file PDF...'}
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
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">File</div>
                      <div className="mt-1 text-sm text-slate-700">{d.fileUrl || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Dibuat Oleh</div>
                      <div className="mt-1 text-sm text-slate-700">{d.dibuatOleh ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Dibuat Pada</div>
                      <div className="mt-1 text-sm text-slate-700">{d.createdAt ? d.createdAt.slice(0, 10) : '-'}</div>
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
