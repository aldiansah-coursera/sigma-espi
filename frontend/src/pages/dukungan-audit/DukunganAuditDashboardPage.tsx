import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, FileStack, Send } from 'lucide-react'
import { DukunganAuditShell } from '../../components/dukungan-audit/DukunganAuditShell'
import { dukunganAuditStatusBadgeClass } from '../../components/dukungan-audit/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import type { DokumenProgram } from '../../services/dukunganAuditService'
import { getDokumenList } from '../../services/dukunganAuditService'

export function DukunganAuditDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dokumenList, setDokumenList] = useState<DokumenProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    function load() {
      void getDokumenList().then((data) => {
        if (cancelled) return
        setDokumenList(data)
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

  const draftCount = useMemo(() => dokumenList.filter((d) => d.status === 'Draft').length, [dokumenList])
  const diajukanCount = useMemo(() => dokumenList.filter((d) => d.status === 'Diajukan').length, [dokumenList])
  const checkedCount = useMemo(() => dokumenList.filter((d) => d.status === 'Checked').length, [dokumenList])
  const approvedCount = useMemo(() => dokumenList.filter((d) => d.status === 'Approved').length, [dokumenList])

  const recentDokumen = useMemo(() => dokumenList.slice(0, 5), [dokumenList])

  return (
    <DukunganAuditShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari dokumen program">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dashboard Dukungan Audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan Dokumen Program: draf disusun di sini, koordinator Dukungan Audit mengajukannya ke Kepala SPI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Draf Belum Diajukan" value={draftCount} subtitle="Menunggu koordinator" icon={FileStack} badge={draftCount > 0 ? 'Pending' : undefined} />
        <StatCard label="Diajukan ke Kepala SPI" value={diajukanCount} subtitle="Menunggu diperiksa" icon={Send} />
        <StatCard label="Sedang Diperiksa" value={checkedCount} subtitle="Status Checked" icon={ClipboardList} />
        <StatCard label="Sudah Disetujui" value={approvedCount} subtitle="Status Approved" icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Dokumen Program Terbaru</h2>
          <p className="mt-0.5 text-sm text-slate-500">5 dokumen program yang terakhir Anda susun.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.6fr_1fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Judul</span>
          <span>Kategori</span>
          <span>Direview Oleh</span>
          <span className="text-right">Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && recentDokumen.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada dokumen program yang dibuat.
            </div>
          )}
          {recentDokumen.map((d) => (
            <div
              key={d.regulasiId}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.6fr_1fr_1fr_auto]"
            >
              <div className="truncate font-semibold text-slate-800">{d.judul}</div>
              <div className="truncate text-slate-600">{d.kategori}</div>
              <div className="truncate text-slate-600">{d.direviewOleh ?? '-'}</div>
              <div className="flex justify-end">
                <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${dukunganAuditStatusBadgeClass(d.status)}`}>
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DukunganAuditShell>
  )
}
