import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, ClipboardList, RotateCcw } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { Pkpt } from '../../services/kepalaSpiService'
import { approvePkpt, checkPkpt, getPkptList, kembalikanPkpt } from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

// Data lama sebelum alur v3.0 berstatus "Pending" -- diperlakukan sama
// dengan "Diajukan" supaya tetap bisa diproses.
function siapDiperiksa(status: string): boolean {
  return status === 'Diajukan' || status === 'Pending'
}

/**
 * Tahap 06 flowmap SIGMA v3.0 -- Kepala SPI "Memeriksa & Mengesahkan PKPT".
 * Penyusunan drafnya ada di Dukungan Audit (menu Data PKPT); di sini Kepala
 * SPI hanya memeriksa (Checked), mengesahkan (Approved), atau mengembalikan
 * dengan catatan revisi. Penerbitannya kembali ke Dukungan Audit.
 */
export function PersetujuanPkptPage() {
  const [pkptList, setPkptList] = useState<Pkpt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    function load() {
      void getPkptList().then((data) => {
        if (cancelled) return
        setPkptList(data)
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

  const filteredPkpt = useMemo(
    () => pkptList.filter((p) => matchesQuery(searchQuery, p.namaPkpt, p.status, String(p.tahunAnggaran), p.dibuatOleh)),
    [pkptList, searchQuery],
  )

  const menungguPeriksaCount = pkptList.filter((p) => siapDiperiksa(p.status)).length
  const checkedCount = pkptList.filter((p) => p.status === 'Checked').length
  const disahkanCount = pkptList.filter((p) => p.status === 'Approved' || p.status === 'Diterbitkan').length

  async function runAction(id: number, action: () => Promise<void>, gagalPesan: string) {
    setBusyId(id)
    try {
      await action()
      setPkptList(await getPkptList())
    } catch (err) {
      window.alert(extractErrorMessage(err, gagalPesan))
    } finally {
      setBusyId(null)
    }
  }

  async function handleKembalikan(p: Pkpt) {
    const catatan = window.prompt(`Catatan revisi untuk "${p.namaPkpt}":`, '')
    if (catatan === null) return
    await runAction(p.pkptId, () => kembalikanPkpt(p.pkptId, catatan.trim()), 'Gagal mengembalikan PKPT.')
  }

  return (
    <KepalaSpiShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nama PKPT atau penyusun"
    >
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pemeriksaan &amp; Pengesahan PKPT</h1>
        <p className="mt-1 text-sm text-slate-500">
          Periksa dan sahkan draf Program Kerja Pengawasan Tahunan yang disusun Dukungan Audit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu Diperiksa"
          value={menungguPeriksaCount}
          icon={ClipboardList}
          badge={menungguPeriksaCount > 0 ? 'Pending' : undefined}
        />
        <StatCard label="Sudah Diperiksa" value={checkedCount} icon={ClipboardCheck} subtitle="Menunggu pengesahan" />
        <StatCard label="Sudah Disahkan" value={disahkanCount} icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar PKPT</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh PKPT dari Dukungan Audit beserta statusnya.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_0.6fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nama PKPT</span>
          <span>Tahun</span>
          <span>Disusun Oleh</span>
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
                  <div className="truncate text-slate-600">{p.dibuatOleh ?? '-'}</div>
                  <div>
                    <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {siapDiperiksa(p.status) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void runAction(p.pkptId, () => checkPkpt(p.pkptId), 'Gagal memeriksa PKPT.')}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Periksa
                      </button>
                    )}
                    {p.status === 'Checked' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void runAction(p.pkptId, () => approvePkpt(p.pkptId), 'Gagal mengesahkan PKPT.')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sahkan
                      </button>
                    )}
                    {(siapDiperiksa(p.status) || p.status === 'Checked') && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleKembalikan(p)}
                        className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        Kembalikan
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Periode</div>
                        <div className="mt-1 text-sm text-slate-700">
                          {p.tanggalMulai} s/d {p.tanggalSelesai}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Diperiksa Oleh</div>
                        <div className="mt-1 text-sm text-slate-700">{p.disahkanOleh ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Diterbitkan</div>
                        <div className="mt-1 text-sm text-slate-700">
                          {p.diterbitkanOleh ? `${p.diterbitkanOleh} (${p.tanggalTerbit ?? '-'})` : '-'}
                        </div>
                      </div>
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
    </KepalaSpiShell>
  )
}
