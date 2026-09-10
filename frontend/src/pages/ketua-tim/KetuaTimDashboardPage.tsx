import { useState } from 'react'
import { AlertTriangle, FileStack, Info } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressRing } from '../../components/ui/ProgressRing'

interface KkaPendingRow {
  noKka: string
  objekAudit: string
  auditor: string
  status: string
}

// Data contoh (statis) mengikuti mockup UI/UX Ketua Tim -- belum
// tersambung ke backend, menyusul setelah modul PKA/KKA sisi backend
// dibangun.
const KKA_PENDING_REVIEW: KkaPendingRow[] = [
  { noKka: 'KKA/041/001', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal, Fahri, Panji', status: 'In Review' },
  { noKka: 'KKA/041/001', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal, Fahri, Panji', status: 'In Review' },
  { noKka: 'KKA/041/001', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal, Fahri, Panji', status: 'In Review' },
  { noKka: 'KKA/041/001', objekAudit: 'Pengujian Mesin Hangar 3', auditor: 'Naufal, Fahri, Panji', status: 'In Review' },
]

const PROGRESS_LAPANGAN_PERCENT = 65
const LANGKAH_PKA_SELESAI = 13
const LANGKAH_PKA_TOTAL = 20

export function KetuaTimDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredKka = KKA_PENDING_REVIEW.filter((row) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return row.noKka.toLowerCase().includes(q) || row.objekAudit.toLowerCase().includes(q)
  })

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari KKA & PKA">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pusat Monitoring &amp; Review Tim Audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan progres lapangan, status persetujuan, dan temuan tim Anda saat ini.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Progress Lapangan"
          value={`${PROGRESS_LAPANGAN_PERCENT}%`}
          subtitle={`${LANGKAH_PKA_SELESAI}/${LANGKAH_PKA_TOTAL} Langkah PKA`}
          customIcon={<ProgressRing percent={PROGRESS_LAPANGAN_PERCENT} />}
        />
        <StatCard
          label="Review KKA Pending"
          value={KKA_PENDING_REVIEW.length}
          subtitle="Kertas Kerja Audit"
          icon={FileStack}
        />
        <StatCard
          label="Temuan High Risk"
          value={2}
          subtitle="Butuh Penanganan Segera"
          icon={AlertTriangle}
        />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Kertas Kerja Audit (KKA) Pending Review</h2>
          <p className="mt-0.5 text-sm text-slate-500">Kertas Kerja Audit yang diajukan tim dan menunggu review Anda.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.6fr_1.4fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. KKA</span>
          <span>Objek Audit</span>
          <span>Auditor</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredKka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada KKA yang cocok.
            </div>
          )}
          {filteredKka.map((row, index) => (
            <div
              key={`${row.noKka}-${index}`}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.6fr_1.4fr_0.8fr_auto]"
            >
              <div className="truncate font-semibold text-blue-700">{row.noKka}</div>
              <div className="min-w-0 truncate text-slate-600">{row.objekAudit}</div>
              <div className="min-w-0 truncate text-slate-600">{row.auditor}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                <Info size={14} />
                Info KKA
              </button>
            </div>
          ))}
        </div>
      </section>
    </KetuaTimShell>
  )
}
