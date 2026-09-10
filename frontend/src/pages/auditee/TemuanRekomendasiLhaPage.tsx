import { useState } from 'react'
import { ChevronDown, Download, FileText } from 'lucide-react'
import { AuditeeShell } from '../../components/auditee/AuditeeShell'
import { auditeeStatusBadgeClass } from '../../components/auditee/statusBadge'

interface TemuanLha {
  id: number
  noTemuan: string
  temuan: string
  rekomendasi: string
  status: string
}

// Data contoh (statis) -- ringkasan LHA yang sudah diterbitkan beserta
// temuan & rekomendasi di dalamnya. Sisi backend belum dibangun; tombol
// unduh & baris yang bisa diperluas murni interaksi tampilan.
const TEMUAN_LHA: TemuanLha[] = [
  {
    id: 1,
    noTemuan: 'TM/041/001',
    temuan: 'Keterlambatan perawatan berkala pada 3 unit mesin produksi.',
    rekomendasi: 'Percepat proses pengadaan suku cadang kritis dan terapkan eskalasi otomatis pada sistem monitoring perawatan.',
    status: 'Open',
  },
  {
    id: 2,
    noTemuan: 'TM/041/002',
    temuan: 'Proses pengadaan suku cadang melebihi SLA internal 14 hari kerja.',
    rekomendasi: 'Evaluasi ulang alur persetujuan pengadaan dan tetapkan mekanisme eskalasi saat mendekati batas waktu SLA.',
    status: 'Closed',
  },
]

export function TemuanRekomendasiLhaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [unduhMessage, setUnduhMessage] = useState('')

  const filteredTemuan = TEMUAN_LHA.filter(
    (t) => t.noTemuan.toLowerCase().includes(searchQuery.trim().toLowerCase()) || t.temuan.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  function handleUnduh() {
    setUnduhMessage('Berkas LHA/041/001.pdf sedang disiapkan untuk diunduh...')
  }

  return (
    <AuditeeShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari temuan">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Temuan &amp; Rekomendasi LHA</h1>
        <p className="mt-1 text-sm text-slate-500">Daftar temuan dan rekomendasi yang tercantum pada Laporan Hasil Audit unit Anda.</p>
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FileText size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-800">LHA/041/001</p>
              <p className="text-xs text-slate-400">Diterbitkan 20 Agustus 2026 &middot; Ketua Tim: Ahmad Fauzi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnduh}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Download size={14} />
            Unduh PDF
          </button>
        </div>
        {unduhMessage && <p className="mt-3 text-xs font-semibold text-blue-700">{unduhMessage}</p>}
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Temuan &amp; Rekomendasi</h2>
          <p className="mt-0.5 text-sm text-slate-500">Klik salah satu baris untuk melihat rekomendasi lengkap.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_2fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. Temuan</span>
          <span>Temuan</span>
          <span>Status</span>
          <span className="text-right">Detail</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredTemuan.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada temuan yang cocok.
            </div>
          )}
          {filteredTemuan.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === t.id ? null : t.id))}
                className="grid w-full min-w-0 grid-cols-2 items-center gap-4 px-5 py-4 text-left sm:grid-cols-[1fr_2fr_1fr_auto]"
              >
                <div className="truncate font-semibold text-blue-700">{t.noTemuan}</div>
                <div className="min-w-0 truncate text-slate-600">{t.temuan}</div>
                <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditeeStatusBadgeClass(t.status)}`}>
                  {t.status}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform sm:justify-self-end ${expandedId === t.id ? 'rotate-180' : ''}`} />
              </button>
              {expandedId === t.id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Rekomendasi</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.rekomendasi}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </AuditeeShell>
  )
}
