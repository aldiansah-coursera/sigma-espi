import { useEffect, useMemo, useState } from 'react'
import { Briefcase, FileCheck2 } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressRing } from '../../components/ui/ProgressRing'
import type { Lha, Pkpt, Sta } from '../../services/kepalaSpiService'
import { getLhaList, getPkptList, getStaList } from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function KepalaSpiDashboardPage() {
  const [pkptList, setPkptList] = useState<Pkpt[]>([])
  const [staList, setStaList] = useState<Sta[]>([])
  const [lhaList, setLhaList] = useState<Lha[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pkpt, sta, lha] = await Promise.all([getPkptList(), getStaList(), getLhaList()])
      if (cancelled) return
      setPkptList(pkpt)
      setStaList(sta)
      setLhaList(lha)
      setIsLoading(false)
    }
    void load()
    const interval = setInterval(() => {
      void Promise.all([getPkptList(), getStaList(), getLhaList()]).then(([pkpt, sta, lha]) => {
        if (cancelled) return
        setPkptList(pkpt)
        setStaList(sta)
        setLhaList(lha)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const pkptApprovedCount = useMemo(() => pkptList.filter((p) => p.status === 'Approved').length, [pkptList])
  const pkptProgress = pkptList.length > 0 ? Math.round((pkptApprovedCount / pkptList.length) * 100) : 0
  const staActiveCount = useMemo(() => staList.filter((s) => s.statusApproval === 'Active').length, [staList])
  const lhaPendingCount = useMemo(() => lhaList.filter((l) => l.status !== 'Approved').length, [lhaList])

  const recentPkpt = useMemo(
    () => pkptList.filter((p) => matchesQuery(searchQuery, p.namaPkpt, String(p.tahunAnggaran))).slice(0, 5),
    [pkptList, searchQuery],
  )
  const recentSta = useMemo(
    () => staList.filter((s) => matchesQuery(searchQuery, s.nomorSta, s.objekAudit, s.ketuaTim)).slice(0, 5),
    [staList, searchQuery],
  )

  return (
    <KepalaSpiShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari PKPT atau STA">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dashboard Kepala SPI</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan perencanaan pengawasan, penugasan audit, dan otorisasi laporan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="PKPT Tahunan"
          value={`${pkptProgress}%`}
          subtitle="Progress Pengawasan SPI"
          customIcon={<ProgressRing percent={pkptProgress} />}
        />
        <StatCard
          label="Surat Tugas Audit (STA)"
          value={staActiveCount}
          subtitle="Penugasan Berjalan"
          icon={Briefcase}
        />
        <StatCard
          label="Otorisasi LHA"
          value={lhaPendingCount}
          subtitle="Menunggu Persetujuan Akhir"
          icon={FileCheck2}
          badge={lhaPendingCount > 0 ? 'Perlu Tindakan' : undefined}
        />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">PKPT Terbaru</h2>
          <p className="mt-0.5 text-sm text-slate-500">Program Kerja Pengawasan Tahunan yang baru dibuat.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.6fr_0.8fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nama PKPT</span>
          <span>Tahun</span>
          <span>Periode</span>
          <span>Objek</span>
          <span className="text-right">Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && recentPkpt.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada PKPT yang dibuat.
            </div>
          )}
          {recentPkpt.map((p) => (
            <div
              key={p.pkptId}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.6fr_0.8fr_1fr_0.8fr_auto]"
            >
              <div className="min-w-0 truncate font-semibold text-slate-800">{p.namaPkpt}</div>
              <div className="truncate text-slate-600">{p.tahunAnggaran}</div>
              <div className="min-w-0 truncate text-xs text-slate-500">
                {p.tanggalMulai} &ndash; {p.tanggalSelesai}
              </div>
              <div className="truncate text-slate-600">{p.totalObjek} objek</div>
              <span
                className={`inline-flex w-fit justify-self-end rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(p.status)}`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Penugasan STA Terbaru</h2>
          <p className="mt-0.5 text-sm text-slate-500">Surat Tugas Audit yang baru diterbitkan.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nomor STA</span>
          <span>Objek Audit</span>
          <span>Ketua Tim</span>
          <span>Tanggal Terbit</span>
          <span className="text-right">Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && recentSta.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada Surat Tugas Audit yang diterbitkan.
            </div>
          )}
          {recentSta.map((s) => (
            <div
              key={s.penugasanId}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.4fr_1fr_1fr_auto]"
            >
              <div className="min-w-0 truncate font-semibold text-slate-800">{s.nomorSta}</div>
              <div className="min-w-0 truncate text-slate-600">
                {s.objekAudit}
                <div className="truncate text-xs text-slate-400">{s.unitKerja}</div>
              </div>
              <div className="truncate text-slate-600">{s.ketuaTim}</div>
              <div className="truncate text-slate-500">{s.tanggalTerbit}</div>
              <span
                className={`inline-flex w-fit justify-self-end rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(s.statusApproval)}`}
              >
                {s.statusApproval}
              </span>
            </div>
          ))}
        </div>
      </section>
    </KepalaSpiShell>
  )
}
