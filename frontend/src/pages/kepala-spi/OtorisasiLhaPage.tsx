import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, FileText, MailCheck, PenTool, Printer } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import type { Lha, LhaSummary } from '../../services/kepalaSpiService'
import { authorizeLha, getLhaList, getLhaSummary } from '../../services/kepalaSpiService'

const CURRENT_YEAR = 2026

const EMPTY_SUMMARY: LhaSummary = {
  menungguOtorisasi: 0,
  lhaDiterbitkanTahunIni: 0,
  criticalHighFindings: 0,
}

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function OtorisasiLhaPage() {
  const [lhaList, setLhaList] = useState<Lha[]>([])
  const [summary, setSummary] = useState<LhaSummary>(EMPTY_SUMMARY)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadAll() {
    const [lha, lhaSummary] = await Promise.all([getLhaList(), getLhaSummary()])
    return { lha, lhaSummary }
  }

  useEffect(() => {
    let cancelled = false
    loadAll().then(({ lha, lhaSummary }) => {
      if (cancelled) return
      setLhaList(lha)
      setSummary(lhaSummary)
      setIsLoading(false)
    })
    const interval = setInterval(() => {
      void loadAll().then(({ lha, lhaSummary }) => {
        if (cancelled) return
        setLhaList(lha)
        setSummary(lhaSummary)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredLha = useMemo(
    () => lhaList.filter((l) => matchesQuery(searchQuery, l.nomorLha, l.nomorSta, l.objekAudit, l.ketuaTim)),
    [lhaList, searchQuery],
  )

  async function handleAuthorize(id: number) {
    setBusyId(id)
    try {
      await authorizeLha(id)
      const { lha, lhaSummary } = await loadAll()
      setLhaList(lha)
      setSummary(lhaSummary)
    } finally {
      setBusyId(null)
    }
  }

  function handlePrint(l: Lha) {
    if (!l.fileUrl) return
    window.open(l.fileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <KepalaSpiShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari LHA">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Otorisasi LHA</h1>
        <p className="mt-1 text-sm text-slate-500">Peninjauan Eksklusif &amp; Pengesahan Final Laporan Hasil Audit</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu Otorisasi"
          value={summary.menungguOtorisasi}
          subtitle="Draf LHA Ready"
          icon={MailCheck}
        />
        <StatCard
          label={`LHA Diterbitkan (${CURRENT_YEAR})`}
          value={summary.lhaDiterbitkanTahunIni}
          subtitle="Laporan Resmi"
          icon={FileText}
        />
        <StatCard
          label="Critical / High Findings"
          value={summary.criticalHighFindings}
          subtitle="Temuan High Risk"
          customIcon={<AlertTriangle size={44} strokeWidth={1.5} className="text-amber-500" />}
        />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Daftar Pengajuan Otorisasi Laporan Hasil Audit (LHA)</h2>

        <div className="mt-5 hidden grid-cols-[1.1fr_1.3fr_1fr_0.8fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. Draf/STA</span>
          <span>Objek Audit</span>
          <span>Ketua Tim</span>
          <span>Anggota Tim</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredLha.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              {lhaList.length === 0
                ? 'Belum ada LHA yang menunggu otorisasi. Daftar ini akan terisi otomatis setelah alur Ketua Tim dan Tim QA menyelesaikan reviu laporan.'
                : 'Tidak ada LHA yang cocok dengan pencarian.'}
            </div>
          )}
          {filteredLha.map((l) => (
            <div
              key={l.lhaId}
              className="grid grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.1fr_1.3fr_1fr_0.8fr_0.8fr_auto]"
            >
              <div className="font-semibold text-blue-700">{l.nomorLha}</div>
              <div className="text-slate-700">{l.objekAudit}</div>
              <div className="text-slate-600">{l.ketuaTim}</div>
              <div className="text-slate-600">{l.anggotaTimCount} Anggota</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(l.status)}`}>
                {l.status}
              </span>
              <div className="sm:justify-self-end">
                {l.status === 'Approved' ? (
                  <button
                    type="button"
                    disabled={!l.fileUrl}
                    onClick={() => handlePrint(l)}
                    title={l.fileUrl ? 'Cetak LHA' : 'File LHA belum tersedia'}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Printer size={14} />
                    Cetak LHA
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === l.lhaId}
                    onClick={() => void handleAuthorize(l.lhaId)}
                    title="Tinjau & sahkan LHA"
                    className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <PenTool size={14} />
                    Review &amp; Sign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </KepalaSpiShell>
  )
}
