import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, Plus, Send, Trash2, UserCheck, X } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { Ppp, PppObjekOption } from '../../services/ketuaTimService'
import {
  ajukanPpp,
  createPpp,
  getPppList,
  getPppObjekOptions,
  hapusPppDraft,
} from '../../services/ketuaTimService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

/**
 * Tahap 06 flowmap SIGMA v3.0 -- Ketua Tim MENGUSULKAN Program & Pengajuan
 * Penugasan (PPP). Setelah diajukan, Pengawas yang menyetujui & meneruskan
 * ke Kepala SPI; Surat Tugas-nya baru dibuat Dukungan Audit setelah PPP
 * disetujui.
 */
export function PengajuanPppPage() {
  const [pppList, setPppList] = useState<Ppp[]>([])
  const [objekOptions, setObjekOptions] = useState<PppObjekOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [objekId, setObjekId] = useState('')
  const [ruangLingkup, setRuangLingkup] = useState('')
  const [sasaranAudit, setSasaranAudit] = useState('')
  const [komposisiTim, setKomposisiTim] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadAll() {
    const [ppp, objek] = await Promise.all([getPppList(), getPppObjekOptions()])
    return { ppp, objek }
  }

  useEffect(() => {
    let cancelled = false
    void loadAll().then(({ ppp, objek }) => {
      if (cancelled) return
      setPppList(ppp)
      setObjekOptions(objek)
      setIsLoading(false)
    })
    const interval = setInterval(() => {
      void loadAll().then(({ ppp, objek }) => {
        if (cancelled) return
        setPppList(ppp)
        setObjekOptions(objek)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredPpp = useMemo(
    () => pppList.filter((p) => matchesQuery(searchQuery, p.namaPkpt, p.unitKerja, p.jenisPengawasan, p.status)),
    [pppList, searchQuery],
  )

  const draftCount = pppList.filter((p) => p.status === 'Draft').length
  const prosesCount = pppList.filter((p) => p.status === 'Diajukan' || p.status === 'Diteruskan').length
  const disetujuiCount = pppList.filter((p) => p.status === 'Disetujui').length

  function openForm() {
    setFormError('')
    setObjekId('')
    setRuangLingkup('')
    setSasaranAudit('')
    setKomposisiTim('')
    setTanggalMulai('')
    setTanggalSelesai('')
    setShowForm(true)
  }

  async function submitPpp() {
    if (!objekId) {
      setFormError('Objek pengawasan wajib dipilih.')
      return
    }
    if (!ruangLingkup.trim() || !sasaranAudit.trim()) {
      setFormError('Ruang lingkup dan sasaran audit wajib diisi.')
      return
    }
    if (!tanggalMulai || !tanggalSelesai) {
      setFormError('Jangka waktu penugasan wajib diisi.')
      return
    }
    if (tanggalSelesai < tanggalMulai) {
      setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }

    setFormError('')
    setIsSaving(true)
    try {
      await createPpp({
        objekId: Number(objekId),
        ruangLingkup: ruangLingkup.trim(),
        sasaranAudit: sasaranAudit.trim(),
        komposisiTim: komposisiTim.trim() || undefined,
        tanggalMulai,
        tanggalSelesai,
      })
      const { ppp, objek } = await loadAll()
      setPppList(ppp)
      setObjekOptions(objek)
      setShowForm(false)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Gagal menyimpan usulan PPP.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function runAction(id: number, action: (id: number) => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action(id)
      const { ppp, objek } = await loadAll()
      setPppList(ppp)
      setObjekOptions(objek)
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleHapus(p: Ppp) {
    if (!window.confirm(`Hapus draf PPP untuk "${p.jenisPengawasan ?? '-'}"?`)) return
    await runAction(p.pppId, hapusPppDraft, 'Gagal menghapus draf PPP.')
  }

  return (
    <KetuaTimShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari objek atau unit kerja"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pengajuan Penugasan (PPP)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Usulkan Program &amp; Pengajuan Penugasan untuk objek yang PKPT-nya sudah disahkan, lalu ajukan ke Pengawas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Usulkan PPP Baru'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Draf Usulan" value={draftCount} icon={ClipboardList} badge={draftCount > 0 ? 'Draft' : undefined} />
        <StatCard label="Dalam Proses Persetujuan" value={prosesCount} icon={Send} />
        <StatCard label="Disetujui Kepala SPI" value={disetujuiCount} icon={UserCheck} />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Usulan PPP Baru</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Hanya objek pengawasan dari PKPT yang sudah disahkan dan belum punya PPP yang bisa dipilih.
          </p>

          {objekOptions.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
              Belum ada objek pengawasan yang siap diusulkan. Tunggu PKPT disahkan Kepala SPI dulu.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Objek Pengawasan</label>
                <select
                  value={objekId}
                  onChange={(e) => setObjekId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Pilih objek pengawasan
                  </option>
                  {objekOptions.map((o) => (
                    <option key={o.objekId} value={o.objekId}>
                      {o.jenisPengawasan} &mdash; {o.unitKerja} ({o.namaPkpt})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ruang Lingkup</label>
                <textarea
                  rows={2}
                  value={ruangLingkup}
                  onChange={(e) => setRuangLingkup(e.target.value)}
                  placeholder="mis. Audit kepatuhan proses pengadaan periode Januari-Juni 2026"
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Sasaran Audit</label>
                <textarea
                  rows={2}
                  value={sasaranAudit}
                  onChange={(e) => setSasaranAudit(e.target.value)}
                  placeholder="mis. Memastikan proses pengadaan sesuai SOP dan tidak ada penyimpangan anggaran"
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                  Komposisi Tim yang Diusulkan
                </label>
                <textarea
                  rows={2}
                  value={komposisiTim}
                  onChange={(e) => setKomposisiTim(e.target.value)}
                  placeholder="mis. Ketua Tim: Rona D. | Anggota: Reni K., Rizka R."
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

          {objekOptions.length > 0 && (
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
                onClick={() => void submitPpp()}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Draf'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Usulan PPP</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh usulan penugasan beserta status persetujuannya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Objek Pengawasan</span>
          <span>Unit Kerja</span>
          <span>Jangka Waktu</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredPpp.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada usulan PPP yang cocok.
            </div>
          )}
          {filteredPpp.map((p) => {
            const isExpanded = expandedId === p.pppId
            const isBusy = busyId === p.pppId
            return (
              <div key={p.pppId} className="rounded-2xl bg-white shadow-sm">
                <div className="grid w-full min-w-0 grid-cols-1 items-center gap-3 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : p.pppId)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className="truncate font-semibold text-slate-800">{p.jenisPengawasan ?? '-'}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                  <div className="truncate text-slate-600">{p.unitKerja ?? '-'}</div>
                  <div className="truncate text-xs text-slate-500">
                    {p.tanggalMulai ?? '-'} s/d {p.tanggalSelesai ?? '-'}
                  </div>
                  <div>
                    <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {p.status === 'Draft' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runAction(p.pppId, ajukanPpp, 'Gagal mengajukan PPP.')}
                          className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={13} />
                          Ajukan
                        </button>
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
                  </div>
                </div>

                {p.catatanRevisi && p.status === 'Draft' && (
                  <p className="px-5 pb-3 text-xs font-semibold text-amber-700">Catatan revisi: {p.catatanRevisi}</p>
                )}

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ruang Lingkup</div>
                        <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{p.ruangLingkup ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Sasaran Audit</div>
                        <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{p.sasaranAudit ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Komposisi Tim</div>
                        <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{p.komposisiTim || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Riwayat Persetujuan</div>
                        <div className="mt-1 text-sm text-slate-700">
                          Diusulkan: {p.diusulkanOleh ?? '-'}
                          <br />
                          Pengawas: {p.disetujuiPengawas ?? '-'}
                          <br />
                          Kepala SPI: {p.disetujuiKepalaSpi ?? '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </KetuaTimShell>
  )
}
