import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardList, RotateCcw, Send } from 'lucide-react'
import { PengawasTimShell } from '../../components/pengawas-tim/PengawasTimShell'
import { pengawasStatusBadgeClass } from '../../components/pengawas-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { Ppp } from '../../services/pengawasService'
import { getPppList, kembalikanPpp, teruskanPpp } from '../../services/pengawasService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

/**
 * Tahap 06 flowmap SIGMA v3.0 (sisi penyetuju) -- Pengawas (Ka. Departemen
 * Pengawasan) menelaah usulan PPP dari Ketua Tim, lalu MENERUSKAN ke Kepala
 * SPI atau mengembalikannya dengan catatan revisi.
 */
export function PersetujuanPppPage() {
  const [pppList, setPppList] = useState<Ppp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      void getPppList().then((data) => {
        if (cancelled) return
        setPppList(data)
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

  const filteredPpp = useMemo(
    () => pppList.filter((p) => matchesQuery(searchQuery, p.jenisPengawasan, p.unitKerja, p.diusulkanOleh, p.status)),
    [pppList, searchQuery],
  )

  const menungguCount = pppList.filter((p) => p.status === 'Diajukan').length
  const diteruskanCount = pppList.filter((p) => p.status === 'Diteruskan').length
  const disetujuiCount = pppList.filter((p) => p.status === 'Disetujui').length

  async function runAction(id: number, action: () => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action()
      setPppList(await getPppList())
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleKembalikan(p: Ppp) {
    const catatan = window.prompt(`Catatan revisi untuk usulan "${p.jenisPengawasan ?? '-'}":`, '')
    if (catatan === null) return
    await runAction(p.pppId, () => kembalikanPpp(p.pppId, catatan.trim()), 'Gagal mengembalikan PPP.')
  }

  return (
    <PengawasTimShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari objek, unit, atau pengusul"
    >
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Persetujuan Penugasan (PPP)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Telaah usulan Program &amp; Pengajuan Penugasan dari Ketua Tim, lalu teruskan ke Kepala SPI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu Telaah"
          value={menungguCount}
          icon={ClipboardList}
          badge={menungguCount > 0 ? 'Pending' : undefined}
        />
        <StatCard label="Diteruskan ke Kepala SPI" value={diteruskanCount} icon={Send} />
        <StatCard label="Sudah Disetujui" value={disetujuiCount} icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Usulan PPP</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh usulan penugasan dari Ketua Tim.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Objek Pengawasan</span>
          <span>Unit Kerja</span>
          <span>Diusulkan Oleh</span>
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
                <div className="grid w-full min-w-0 grid-cols-1 items-center gap-3 px-5 py-4 sm:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] sm:gap-4">
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
                  <div className="truncate text-slate-600">{p.diusulkanOleh ?? '-'}</div>
                  <div>
                    <span
                      className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {p.status === 'Diajukan' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleKembalikan(p)}
                          className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          Kembalikan
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runAction(p.pppId, () => teruskanPpp(p.pppId), 'Gagal meneruskan PPP.')}
                          className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={13} />
                          Setujui &amp; Teruskan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
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
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Jangka Waktu</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {p.tanggalMulai ?? '-'} s/d {p.tanggalSelesai ?? '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </PengawasTimShell>
  )
}
