import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FileSignature, Plus, Send, Share2, Trash2, X } from 'lucide-react'
import { DukunganAuditShell } from '../../components/dukungan-audit/DukunganAuditShell'
import { dukunganAuditStatusBadgeClass } from '../../components/dukungan-audit/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../context/useAuth'
import { extractErrorMessage } from '../../lib/api'
import { DUKUNGAN_AUDIT_ROLE_CODE, DUKUNGAN_AUDIT_STAFF_ROLE_CODE } from '../../lib/roles'
import type { PppOption, SuratTugas } from '../../services/dukunganAuditService'
import {
  ajukanSt,
  buatStDariPpp,
  distribusikanSt,
  getPppOptions,
  getStList,
  hapusStDraft,
} from '../../services/dukunganAuditService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

/**
 * Tahap 08 & 10 flowmap SIGMA v3.0 -- Dukungan Audit membuat draf Surat
 * Tugas dari PPP yang sudah disetujui Kepala SPI, mengajukannya untuk
 * ditandatangani (tahap 09), lalu mendistribusikannya ke pihak terkait.
 */
export function SuratTugasPage() {
  const { user } = useAuth()
  const isKoordinator = user?.role === DUKUNGAN_AUDIT_ROLE_CODE
  const isStaff = user?.role === DUKUNGAN_AUDIT_STAFF_ROLE_CODE

  const [stList, setStList] = useState<SuratTugas[]>([])
  const [pppOptions, setPppOptions] = useState<PppOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [selectedPppId, setSelectedPppId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadAll() {
    const [st, ppp] = await Promise.all([getStList(), getPppOptions()])
    return { st, ppp }
  }

  useEffect(() => {
    let cancelled = false
    void loadAll().then(({ st, ppp }) => {
      if (cancelled) return
      setStList(st)
      setPppOptions(ppp)
      setIsLoading(false)
    })
    const interval = setInterval(() => {
      void loadAll().then(({ st, ppp }) => {
        if (cancelled) return
        setStList(st)
        setPppOptions(ppp)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredSt = useMemo(
    () => stList.filter((s) => matchesQuery(searchQuery, s.nomorSta, s.objekAudit, s.unitKerja, s.ketuaTim, s.statusApproval)),
    [stList, searchQuery],
  )

  const draftCount = stList.filter((s) => s.statusApproval === 'Draft').length
  const menungguTtdCount = stList.filter((s) => s.statusApproval === 'Diajukan').length
  const siapDistribusiCount = stList.filter((s) => s.statusApproval === 'Ditandatangani').length

  async function submitDraft() {
    if (!selectedPppId) {
      setFormError('PPP wajib dipilih.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      await buatStDariPpp(Number(selectedPppId))
      const { st, ppp } = await loadAll()
      setStList(st)
      setPppOptions(ppp)
      setShowForm(false)
      setSelectedPppId('')
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Gagal membuat draf Surat Tugas.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function runAction(id: number, action: (id: number) => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action(id)
      const { st, ppp } = await loadAll()
      setStList(st)
      setPppOptions(ppp)
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleHapus(s: SuratTugas) {
    if (!window.confirm(`Hapus draf Surat Tugas "${s.nomorSta}"?`)) return
    await runAction(s.penugasanId, hapusStDraft, 'Gagal menghapus draf Surat Tugas.')
  }

  const selectedPpp = pppOptions.find((p) => String(p.pppId) === selectedPppId)

  return (
    <DukunganAuditShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nomor ST atau objek audit"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Surat Tugas (ST)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat draf Surat Tugas dari PPP yang telah disetujui, ajukan ke Kepala SPI untuk ditandatangani, lalu
            distribusikan ke pihak terkait.
          </p>
        </div>
        {isStaff && (
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setSelectedPppId('')
              setShowForm((prev) => !prev)
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Batal' : 'Buat Draf ST'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Draf Belum Diajukan" value={draftCount} icon={FileSignature} badge={draftCount > 0 ? 'Draft' : undefined} />
        <StatCard label="Menunggu Tanda Tangan" value={menungguTtdCount} icon={Send} />
        <StatCard
          label="Siap Didistribusikan"
          value={siapDistribusiCount}
          icon={Share2}
          badge={siapDistribusiCount > 0 ? 'Distribusi' : undefined}
        />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Buat Draf Surat Tugas</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Isi ST diambil otomatis dari PPP terpilih. Nomor ST dibuat otomatis oleh sistem.
          </p>

          {pppOptions.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
              Belum ada PPP yang siap dibuatkan Surat Tugas. Pastikan PPP-nya sudah disetujui Kepala SPI dan belum
              punya ST.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                  PPP yang Sudah Disetujui
                </label>
                <select
                  value={selectedPppId}
                  onChange={(e) => setSelectedPppId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Pilih PPP
                  </option>
                  {pppOptions.map((p) => (
                    <option key={p.pppId} value={p.pppId}>
                      {p.jenisPengawasan} &mdash; {p.unitKerja} ({p.diusulkanOleh})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPpp && (
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white px-5 py-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ketua Tim</div>
                    <div className="mt-1 text-sm text-slate-700">{selectedPpp.diusulkanOleh ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Jangka Waktu</div>
                    <div className="mt-1 text-sm text-slate-700">
                      {selectedPpp.tanggalMulai ?? '-'} s/d {selectedPpp.tanggalSelesai ?? '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ruang Lingkup</div>
                    <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedPpp.ruangLingkup ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Sasaran Audit</div>
                    <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedPpp.sasaranAudit ?? '-'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

          {pppOptions.length > 0 && (
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
                disabled={isSaving || !selectedPppId}
                onClick={() => void submitDraft()}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Buat Draf ST'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Surat Tugas</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh Surat Tugas beserta status penandatanganannya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.3fr_1fr_0.9fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nomor ST</span>
          <span>Objek Audit</span>
          <span>Ketua Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredSt.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada Surat Tugas yang cocok.
            </div>
          )}
          {filteredSt.map((s) => {
            const isExpanded = expandedId === s.penugasanId
            const isBusy = busyId === s.penugasanId
            return (
              <div key={s.penugasanId} className="rounded-2xl bg-white shadow-sm">
                <div className="grid w-full min-w-0 grid-cols-1 items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_1.3fr_1fr_0.9fr_auto] sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : s.penugasanId)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className="truncate font-semibold text-slate-800">{s.nomorSta}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="truncate text-slate-700">{s.objekAudit ?? '-'}</div>
                    <div className="truncate text-xs text-slate-400">{s.unitKerja ?? '-'}</div>
                  </div>
                  <div className="truncate text-slate-600">{s.ketuaTim ?? '-'}</div>
                  <div>
                    <span
                      className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${dukunganAuditStatusBadgeClass(s.statusApproval)}`}
                    >
                      {s.statusApproval}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {s.statusApproval === 'Draft' && (
                      <>
                        {isKoordinator && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void runAction(s.penugasanId, ajukanSt, 'Gagal mengajukan Surat Tugas.')}
                            className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send size={13} />
                            Ajukan
                          </button>
                        )}
                        {isStaff && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleHapus(s)}
                            title="Hapus draf"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                    {s.statusApproval === 'Ditandatangani' && isKoordinator && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void runAction(s.penugasanId, distribusikanSt, 'Gagal mendistribusikan Surat Tugas.')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Share2 size={13} />
                        Distribusikan
                      </button>
                    )}
                  </div>
                </div>

                {s.catatanRevisi && s.statusApproval === 'Draft' && (
                  <p className="px-5 pb-3 text-xs font-semibold text-amber-700">Catatan Kepala SPI: {s.catatanRevisi}</p>
                )}

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Jangka Waktu</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {s.tanggalMulai ?? '-'} s/d {s.tanggalSelesai ?? '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ruang Lingkup</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.ruangLingkup ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Sasaran Audit</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.targetAudit ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Komposisi Tim</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.komposisiTim || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ditandatangani</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {s.diterbitkanOleh ? `${s.diterbitkanOleh} (${s.tanggalTerbit ?? '-'})` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Didistribusikan</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {s.didistribusikanOleh ? `${s.didistribusikanOleh} (${s.tanggalDistribusi ?? '-'})` : '-'}
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
