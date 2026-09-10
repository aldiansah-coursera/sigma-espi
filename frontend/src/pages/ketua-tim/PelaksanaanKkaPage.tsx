import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertTriangle, BarChart3, FileText, Info, Plus, SquarePen, UploadCloud, X } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface KkaRow {
  noPka: string
  objekAudit: string
  auditor: string
  temuan: string
  status: string
}

const AUDITOR_OPTIONS = ['Naufal', 'Panji', 'Fahri']
const TEMUAN_OPTIONS = ['No Findings', '1 Med Risk', '2 Med Risk', '1 High Risk']

function emptyKkaForm() {
  return {
    noPka: '',
    objekAudit: '',
    auditor: AUDITOR_OPTIONS[0],
    temuan: TEMUAN_OPTIONS[0],
    namaBukti: '',
  }
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Pelaksanaan & KKA
// sisi backend belum dibangun, jadi halaman ini murni tampilan dulu.
const KKA_LAPANGAN: KkaRow[] = [
  { noPka: 'KKA/041/001', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal', temuan: '1 High Risk', status: 'In Review' },
  { noPka: 'KKA/041/002', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Panji', temuan: 'No Findings', status: 'Approved' },
  { noPka: 'KKA/041/003', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Fahri', temuan: '1 Med Risk', status: 'In Review' },
  { noPka: 'KKA/041/004', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal', temuan: '1 Med Risk', status: 'Approved' },
]

const KKA_DIKERJAKAN = 12
const KKA_TOTAL = 15
const KKA_APPROVED = 8
const KKA_IN_REVIEW = 4
const BUKTI_TERUNGGAH = 28

function temuanBadgeClass(temuan: string): string {
  if (temuan === 'No Findings') return 'bg-emerald-100 text-emerald-700'
  if (temuan.includes('High')) return 'bg-rose-100 text-rose-700'
  if (temuan.includes('Med')) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

export function PelaksanaanKkaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [kkaList, setKkaList] = useState<KkaRow[]>(KKA_LAPANGAN)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyKkaForm())
  const [formError, setFormError] = useState('')

  const filteredKka = kkaList.filter((row) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return row.noPka.toLowerCase().includes(q) || row.objekAudit.toLowerCase().includes(q) || row.auditor.toLowerCase().includes(q)
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Bukti audit wajib berupa file PDF.')
      e.target.value = ''
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    setFormError('')
    setForm((prev) => ({ ...prev, namaBukti: file.name }))
  }

  function batalkanForm() {
    setShowForm(false)
    setForm(emptyKkaForm())
    setFormError('')
  }

  function simpanKkaBaru() {
    if (!form.noPka.trim() || !form.objekAudit.trim()) {
      setFormError('No. PKA dan Objek Audit wajib diisi.')
      return
    }
    if (!form.namaBukti) {
      setFormError('Unggah bukti audit (PDF) terlebih dahulu sebelum menyimpan KKA.')
      return
    }
    setKkaList((prev) => [
      { noPka: form.noPka.trim(), objekAudit: form.objekAudit.trim(), auditor: form.auditor, temuan: form.temuan, status: 'In Review' },
      ...prev,
    ])
    setForm(emptyKkaForm())
    setFormError('')
    setShowForm(false)
  }

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari KKA">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pelaksanaan Audit &amp; Kertas Kerja Audit (KKA)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pencatatan Hasil Pengujian Lapangan, Unggah Bukti Audit, dan Verifikasi KKA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Tutup Form' : 'Input KKA Baru'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="KKA Dikerjakan"
          value={`${KKA_DIKERJAKAN}/${KKA_TOTAL}`}
          subtitle={`${KKA_APPROVED} Approved, ${KKA_IN_REVIEW} In Review`}
          icon={BarChart3}
        />
        <StatCard label="Bukti Terunggah" value={`${BUKTI_TERUNGGAH} File`} subtitle="Dokumen & Foto Lapangan" icon={FileText} />
        <StatCard label="Temuan KKA" value="3 Temuan" subtitle="1 High Risk, 2 Med Risk" icon={AlertTriangle} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Kertas Kerja Audit (KKA) Lapangan</h2>
          <p className="mt-0.5 text-sm text-slate-500">Kertas Kerja Audit hasil pengujian lapangan tim Anda.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.6fr_0.8fr_0.9fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. PKA</span>
          <span>Objek Audit</span>
          <span>Auditor</span>
          <span>Temuan</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredKka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada KKA yang cocok.
            </div>
          )}
          {filteredKka.map((row, index) => (
            <div
              key={`${row.noPka}-${index}`}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.6fr_0.8fr_0.9fr_0.8fr_auto]"
            >
              <div className="truncate font-semibold text-blue-700">{row.noPka}</div>
              <div className="min-w-0 truncate text-slate-600">{row.objekAudit}</div>
              <div className="truncate text-slate-600">{row.auditor}</div>
              <span className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${temuanBadgeClass(row.temuan)}`}>
                {row.temuan}
              </span>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              {row.status === 'Approved' ? (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                  <Info size={14} />
                  Info KKA
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  <SquarePen size={14} />
                  Review KKA
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Input Kertas Kerja Audit (KKA) Baru</h2>
          <p className="mt-0.5 text-sm text-slate-500">Catat KKA hasil pengujian lapangan tim, lengkap dengan bukti audit dalam bentuk PDF.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">No. PKA</label>
              <input
                type="text"
                value={form.noPka}
                onChange={(e) => setForm((prev) => ({ ...prev, noPka: e.target.value }))}
                placeholder="Contoh: KKA/041/005"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Auditor</label>
              <select
                value={form.auditor}
                onChange={(e) => setForm((prev) => ({ ...prev, auditor: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {AUDITOR_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Objek Audit</label>
              <input
                type="text"
                value={form.objekAudit}
                onChange={(e) => setForm((prev) => ({ ...prev, objekAudit: e.target.value }))}
                placeholder="Contoh: Pengujian Mesin Hangar 3"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Temuan</label>
              <select
                value={form.temuan}
                onChange={(e) => setForm((prev) => ({ ...prev, temuan: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {TEMUAN_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Unggah Bukti Audit</label>
              <label
                htmlFor="kka-bukti-input"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 py-4 text-center hover:border-blue-400"
              >
                <UploadCloud size={20} className="text-blue-400" />
                <span className="text-sm font-semibold text-blue-700">{form.namaBukti || 'Klik untuk memilih berkas'}</span>
                <span className="text-xs text-slate-400">Hanya file PDF, maksimal 10MB (file_bukti_url)</span>
                <input id="kka-bukti-input" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={batalkanForm}
              className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300"
            >
              <X size={16} />
              Batal
            </button>
            <button
              type="button"
              onClick={simpanKkaBaru}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              <Plus size={16} />
              Simpan KKA
            </button>
          </div>
        </section>
      )}
    </KetuaTimShell>
  )
}
