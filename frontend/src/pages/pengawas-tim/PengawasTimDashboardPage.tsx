import { useMemo, useState } from 'react'
import { ClipboardCheck, ShieldCheck, Users } from 'lucide-react'
import { PengawasTimShell } from '../../components/pengawas-tim/PengawasTimShell'
import { pengawasStatusBadgeClass } from '../../components/pengawas-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressRing } from '../../components/ui/ProgressRing'

interface TimDiawasi {
  ketuaTim: string
  objekAudit: string
  progres: number
  status: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Pengawas Tim sisi
// backend belum dibangun, jadi dashboard ini murni tampilan ringkasan dulu.
const TIM_DIAWASI: TimDiawasi[] = [
  { ketuaTim: 'Ahmad Fauzi', objekAudit: 'Pengujian Mesin Hangar 3', progres: 65, status: 'Berjalan' },
  { ketuaTim: 'Siti Rahayu', objekAudit: 'Audit Kepatuhan Prosedur K3', progres: 100, status: 'Disetujui' },
  { ketuaTim: 'Budi Santoso', objekAudit: 'Reviu Pengadaan Suku Cadang', progres: 30, status: 'Menunggu Persetujuan' },
  { ketuaTim: 'Dewi Lestari', objekAudit: 'Audit Kinerja Divisi Produksi', progres: 45, status: 'Berjalan' },
]

export function PengawasTimDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTim = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return TIM_DIAWASI
    return TIM_DIAWASI.filter((t) => t.ketuaTim.toLowerCase().includes(q) || t.objekAudit.toLowerCase().includes(q))
  }, [searchQuery])

  const menungguPersetujuan = TIM_DIAWASI.filter((t) => t.status === 'Menunggu Persetujuan').length

  return (
    <PengawasTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari ketua tim atau objek audit">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Dashboard Pengawas Tim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan tim audit yang berada dalam pengawasan Anda, beserta status persetujuan PKA dan validasi KKA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tim Diawasi" value={TIM_DIAWASI.length} icon={Users} />
        <StatCard
          label="PKA Menunggu Persetujuan"
          value={menungguPersetujuan}
          icon={ClipboardCheck}
          badge={menungguPersetujuan > 0 ? 'Perlu Tindakan' : undefined}
        />
        <StatCard label="KKA & Temuan Menunggu Validasi" value={2} icon={ShieldCheck} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Ringkasan Tim yang Diawasi</h2>
          <p className="mt-0.5 text-sm text-slate-500">Progres pelaksanaan penugasan audit tiap Ketua Tim.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.2fr_1.6fr_1fr_1fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Ketua Tim</span>
          <span>Objek Audit</span>
          <span>Progres</span>
          <span>Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredTim.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada tim yang cocok.
            </div>
          )}
          {filteredTim.map((t, index) => (
            <div
              key={index}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.2fr_1.6fr_1fr_1fr]"
            >
              <div className="truncate font-semibold text-slate-800">{t.ketuaTim}</div>
              <div className="min-w-0 truncate text-slate-600">{t.objekAudit}</div>
              <div className="flex items-center gap-2">
                <ProgressRing percent={t.progres} size={32} />
                <span className="text-xs font-semibold text-slate-500">{t.progres}%</span>
              </div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${pengawasStatusBadgeClass(t.status)}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </PengawasTimShell>
  )
}
