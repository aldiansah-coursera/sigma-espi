import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, FileStack, RotateCcw } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import type { DokumenProgram } from '../../services/kepalaSpiService'
import { approveDokumen, checkDokumen, getDokumenProgramList, kembalikanDokumen } from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function DokumenProgramReviewPage() {
  const [dokumenList, setDokumenList] = useState<DokumenProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionErrorId, setActionErrorId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  function load() {
    return getDokumenProgramList().then((data) => {
      setDokumenList(data)
      setIsLoading(false)
    })
  }

  useEffect(() => {
    let cancelled = false
    load()
    const interval = setInterval(() => {
      if (!cancelled) void load()
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredDokumen = useMemo(
    () => dokumenList.filter((d) => matchesQuery(searchQuery, d.judul, d.kategori, d.status, d.dibuatOleh)),
    [dokumenList, searchQuery],
  )

  const diajukanCount = useMemo(() => dokumenList.filter((d) => d.status === 'Diajukan').length, [dokumenList])
  const checkedCount = useMemo(() => dokumenList.filter((d) => d.status === 'Checked').length, [dokumenList])
  const approvedCount = useMemo(() => dokumenList.filter((d) => d.status === 'Approved').length, [dokumenList])

  async function runAction(id: number, action: (id: number) => Promise<void>) {
    setActionErrorId(null)
    setBusyId(id)
    try {
      await action(id)
      await load()
    } catch {
      setActionErrorId(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <KepalaSpiShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari judul, kategori, atau penyusun">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dokumen Program</h1>
        <p className="mt-1 text-sm text-slate-500">
          Periksa dan setujui draf Dokumen Program (DOK PROG) yang disusun Dukungan Audit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Diajukan, Menunggu Diperiksa" value={diajukanCount} icon={FileStack} badge={diajukanCount > 0 ? 'Pending' : undefined} />
        <StatCard label="Sedang Diperiksa" value={checkedCount} icon={ClipboardCheck} subtitle="Menunggu persetujuan" />
        <StatCard label="Sudah Disetujui" value={approvedCount} icon={CheckCircle2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Dokumen Program</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh dokumen program dari Dukungan Audit.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Judul</span>
          <span>Kategori</span>
          <span>Dibuat Oleh</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredDokumen.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada dokumen program yang cocok.
            </div>
          )}
          {filteredDokumen.map((d) => {
            const isExpanded = expandedId === d.regulasiId
            const isBusy = busyId === d.regulasiId
            return (
              <div key={d.regulasiId} className="rounded-2xl bg-white shadow-sm">
                <div className="grid w-full min-w-0 grid-cols-2 items-center gap-4 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : d.regulasiId)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className="truncate font-semibold text-slate-800">{d.judul}</span>
                    {isExpanded ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
                  </button>
                  <div className="truncate text-slate-600">{d.kategori}</div>
                  <div className="truncate text-slate-600">{d.dibuatOleh ?? '-'}</div>
                  <div>
                    <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {d.status === 'Diajukan' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void runAction(d.regulasiId, checkDokumen)}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Periksa
                      </button>
                    )}
                    {d.status === 'Checked' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runAction(d.regulasiId, kembalikanDokumen)}
                          className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          Kembalikan
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void runAction(d.regulasiId, approveDokumen)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Setujui
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {actionErrorId === d.regulasiId && (
                  <p className="px-5 pb-3 text-xs font-semibold text-red-600">Aksi gagal diproses. Silakan coba lagi.</p>
                )}

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">File</div>
                      <div className="mt-1 text-sm text-slate-700">{d.fileUrl || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Direview Oleh</div>
                      <div className="mt-1 text-sm text-slate-700">{d.direviewOleh ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Dibuat Pada</div>
                      <div className="mt-1 text-sm text-slate-700">{d.createdAt ? d.createdAt.slice(0, 10) : '-'}</div>
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
