import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, FileText, Pencil, Plus, X } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { PenugasanOption, Pka } from '../../services/ketuaTimService'
import { createPka, getPenugasanOptions, getPkaList, updatePka } from '../../services/ketuaTimService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function PengajuanPkaPage() {
  const [pkaList, setPkaList] = useState<Pka[]>([])
  const [penugasanOptions, setPenugasanOptions] = useState<PenugasanOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [penugasanId, setPenugasanId] = useState('')
  const [langkahKerja, setLangkahKerja] = useState('')
  const [alokasiWaktu, setAlokasiWaktu] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pka, options] = await Promise.all([getPkaList(), getPenugasanOptions()])
      if (cancelled) return
      setPkaList(pka)
      setPenugasanOptions(options)
      setIsLoading(false)
    }
    void load()
    const interval = setInterval(() => {
      void getPkaList().then((pka) => {
        if (cancelled) return
        setPkaList(pka)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredPka = useMemo(
    () => pkaList.filter((row) => matchesQuery(searchQuery, row.nomorSta, row.objekAudit, row.langkahKerja)),
    [pkaList, searchQuery],
  )
  const approvedCount = useMemo(() => pkaList.filter((p) => p.statusPersetujuan === 'Approved').length, [pkaList])
  const inReviewCount = useMemo(() => pkaList.filter((p) => p.statusPersetujuan === 'In Review').length, [pkaList])

  function openCreateForm() {
    setFormError('')
    setEditingId(null)
    setPenugasanId(penugasanOptions[0] ? String(penugasanOptions[0].penugasanId) : '')
    setLangkahKerja('')
    setAlokasiWaktu('')
    setShowForm(true)
  }

  function openEditForm(row: Pka) {
    setFormError('')
    setEditingId(row.pkaId)
    setPenugasanId(String(row.penugasanId))
    setLangkahKerja(row.langkahKerja)
    setAlokasiWaktu(row.alokasiWaktu)
    setShowForm(true)
  }

  async function submitPka() {
    if (editingId === null && !penugasanId) {
      setFormError('Pilih STA / objek audit terlebih dahulu.')
      return
    }
    if (!langkahKerja.trim() || !alokasiWaktu.trim()) {
      setFormError('Langkah kerja dan alokasi waktu wajib diisi.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      if (editingId === null) {
        await createPka({
          penugasanId: Number(penugasanId),
          langkahKerja: langkahKerja.trim(),
          alokasiWaktu: alokasiWaktu.trim(),
        })
      } else {
        await updatePka(editingId, {
          langkahKerja: langkahKerja.trim(),
          alokasiWaktu: alokasiWaktu.trim(),
        })
      }
      const refreshed = await getPkaList()
      setPkaList(refreshed)
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Gagal menyimpan PKA. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari KKA & PKA">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pengajuan Program Kerja Audit (PKA)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Susun langkah kerja audit di bawah STA penugasan Anda, lalu ajukan untuk direview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openCreateForm())}
          disabled={!isLoading && penugasanOptions.length === 0 && !showForm}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Tambah Prosedur PKA'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Prosedur PKA"
          value={pkaList.length}
          subtitle={`${approvedCount} Disetujui, ${inReviewCount} In Review`}
          icon={FileText}
        />
        <StatCard label="PKA Disetujui" value={approvedCount} icon={CheckCircle2} />
        <StatCard label="PKA Menunggu Review" value={inReviewCount} icon={Clock} />
      </div>

      {!isLoading && penugasanOptions.length === 0 && (
        <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
          Belum ada STA (Surat Tugas Audit) yang ditugaskan ke Anda sebagai Ketua Tim, jadi PKA baru belum bisa
          dibuat. Hubungi Kepala SPI untuk penerbitan STA.
        </div>
      )}

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">{editingId === null ? 'Tambah Prosedur PKA' : 'Edit Prosedur PKA'}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {editingId === null
              ? 'Pilih STA penugasan Anda, lalu tuliskan langkah kerja dan alokasi waktunya.'
              : 'Perbarui langkah kerja atau alokasi waktu. Status akan kembali ke "In Review".'}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                STA / Objek Audit
              </label>
              <select
                value={penugasanId}
                onChange={(e) => setPenugasanId(e.target.value)}
                disabled={editingId !== null}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="" disabled>
                  Pilih STA
                </option>
                {penugasanOptions.map((o) => (
                  <option key={o.penugasanId} value={o.penugasanId}>
                    {o.nomorSta} — {o.objekAudit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Langkah Kerja</label>
              <textarea
                value={langkahKerja}
                onChange={(e) => setLangkahKerja(e.target.value)}
                rows={3}
                placeholder="Contoh: Melakukan pengujian fungsi mesin pada Hangar 3 sesuai checklist teknis"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Alokasi Waktu</label>
              <input
                type="text"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                placeholder="Contoh: 01/01/2026 - 02/01/2026"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
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
              onClick={() => void submitPka()}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan PKA'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Prosedur Pengujian (Program Kerja Audit)</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh prosedur PKA yang sudah disusun untuk penugasan Anda.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.4fr_1.6fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. STA</span>
          <span>Objek Audit</span>
          <span>Langkah Kerja</span>
          <span>Alokasi Waktu</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredPka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada prosedur PKA yang cocok.
            </div>
          )}
          {filteredPka.map((row) => (
            <div
              key={row.pkaId}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.4fr_1.6fr_1fr_0.8fr_auto]"
            >
              <div className="truncate font-semibold text-blue-700">{row.nomorSta}</div>
              <div className="min-w-0 truncate text-slate-600">{row.objekAudit}</div>
              <div className="min-w-0 truncate text-xs text-slate-500">{row.langkahKerja}</div>
              <div className="min-w-0 truncate text-xs text-slate-500">{row.alokasiWaktu}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.statusPersetujuan)}`}>
                {row.statusPersetujuan}
              </span>
              <button
                type="button"
                onClick={() => openEditForm(row)}
                className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                <Pencil size={14} />
                Edit PKA
              </button>
            </div>
          ))}
        </div>
      </section>
    </KetuaTimShell>
  )
}
