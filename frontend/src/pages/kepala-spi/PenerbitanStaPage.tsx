import { useEffect, useMemo, useState } from 'react'
import { Briefcase, CheckCircle2, ChevronDown, ChevronUp, FileSignature, RotateCcw } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { Sta } from '../../services/kepalaSpiService'
import { getStaList, kembalikanSta, tandaTanganSta } from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

/**
 * Tahap 09 flowmap SIGMA v3.0 -- Kepala SPI "Menandatangani Surat Tugas
 * (ST) & PPP". Drafnya dibuat Dukungan Audit dari PPP yang sudah disetujui
 * (tahap 08); setelah ditandatangani di sini, Dukungan Audit yang
 * mendistribusikannya ke pihak terkait (tahap 10).
 */
export function PenerbitanStaPage() {
  const [staList, setStaList] = useState<Sta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      void getStaList().then((data) => {
        if (cancelled) return
        setStaList(data)
        setIsLoading(false)
      })
    }
    load()
    const interval = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredSta = useMemo(
    () => staList.filter((s) => matchesQuery(searchQuery, s.nomorSta, s.objekAudit, s.unitKerja, s.ketuaTim, s.statusApproval)),
    [staList, searchQuery],
  )

  const menungguTtdCount = staList.filter((s) => s.statusApproval === 'Diajukan').length
  const ditandatanganiCount = staList.filter((s) => s.statusApproval === 'Ditandatangani').length
  const beredarCount = staList.filter((s) => s.statusApproval === 'Didistribusikan' || s.statusApproval === 'Active').length

  async function runAction(id: number, action: () => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action()
      setStaList(await getStaList())
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleKembalikan(s: Sta) {
    const catatan = window.prompt(`Catatan revisi untuk Surat Tugas "${s.nomorSta}":`, '')
    if (catatan === null) return
    await runAction(s.penugasanId, () => kembalikanSta(s.penugasanId, catatan.trim()), 'Gagal mengembalikan Surat Tugas.')
  }

  return (
    <KepalaSpiShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nomor ST atau objek audit"
    >
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Penandatanganan Surat Tugas (ST)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tandatangani Surat Tugas yang drafnya disiapkan Dukungan Audit dari PPP yang telah Anda setujui.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu Tanda Tangan"
          value={menungguTtdCount}
          icon={FileSignature}
          badge={menungguTtdCount > 0 ? 'Pending' : undefined}
        />
        <StatCard label="Sudah Ditandatangani" value={ditandatanganiCount} icon={CheckCircle2} subtitle="Menunggu distribusi" />
        <StatCard label="Sudah Beredar" value={beredarCount} icon={Briefcase} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Surat Tugas</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh Surat Tugas beserta statusnya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.3fr_1fr_0.9fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nomor ST</span>
          <span>Objek Audit</span>
          <span>Ketua Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredSta.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada Surat Tugas yang cocok.
            </div>
          )}
          {filteredSta.map((s) => {
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
                    <div className="truncate text-slate-700">{s.objekAudit}</div>
                    <div className="truncate text-xs text-slate-400">
                      {s.unitKerja} &middot; {s.periode}
                    </div>
                  </div>
                  <div className="truncate text-slate-600">{s.ketuaTim}</div>
                  <div>
                    <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(s.statusApproval)}`}>
                      {s.statusApproval}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {s.statusApproval === 'Diajukan' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleKembalikan(s)}
                          className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          Kembalikan
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runAction(s.penugasanId, () => tandaTanganSta(s.penugasanId), 'Gagal menandatangani Surat Tugas.')}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileSignature size={13} />
                          Tanda Tangani
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Jangka Waktu</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {s.tanggalMulai || '-'} s/d {s.tanggalSelesai || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ruang Lingkup</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.ruangLingkup || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Target / Sasaran Audit</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.targetAudit || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Komposisi Tim</div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.komposisiTim || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Draf Dibuat Oleh</div>
                      <div className="mt-1 text-sm text-slate-700">{s.dibuatOleh ?? '-'}</div>
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
    </KepalaSpiShell>
  )
}
