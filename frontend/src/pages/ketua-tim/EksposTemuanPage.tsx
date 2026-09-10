import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSearch, Info, Megaphone, X } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktRisikoBadgeClass, ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface TemuanRow {
  noPka: string
  objekAudit: string
  tingkatRisiko: string
  status: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Ekspos Temuan sisi
// backend belum dibangun, jadi halaman ini murni tampilan dulu.
const TEMUAN_EKSPOS: TemuanRow[] = [
  { noPka: 'TM/041/001', objekAudit: 'Pengujian Mesin Hangar 3', tingkatRisiko: 'High Risk', status: 'Menunggu Respon' },
  { noPka: 'TM/041/001', objekAudit: 'Pengujian Mesin Hangar 3', tingkatRisiko: '1 Med Risk', status: 'Dikonfirmasi' },
  { noPka: 'TM/041/001', objekAudit: 'Pengujian Mesin Hangar 3', tingkatRisiko: '1 Med Risk', status: 'Disanggah' },
]

const TEMUAN_SIAP_DIEKSPOS = 3
const SUDAH_DIKONFIRMASI = 1
const PERLU_KLARIFIKASI = 1

export function EksposTemuanPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemuan = TEMUAN_EKSPOS.filter((row) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return row.noPka.toLowerCase().includes(q) || row.objekAudit.toLowerCase().includes(q)
  })

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari STA atau LHA">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Ekspos Temuan Kepada Auditee</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mengonfirmasi temuan audit kepada Auditee sebelum dikompilasi ke dalam LHA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Temuan Siap Diekspos" value={TEMUAN_SIAP_DIEKSPOS} subtitle="Menunggu Dikirim ke Auditee" icon={Megaphone} />
        <StatCard label="Sudah Dikonfirmasi" value={SUDAH_DIKONFIRMASI} subtitle="Auditee Menyetujui Pertemuan" icon={CheckCircle2} />
        <StatCard label="Perlu Klarifikasi" value={PERLU_KLARIFIKASI} subtitle="Ada Sanggahan dari Auditee" icon={AlertTriangle} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Temuan untuk Sesi Ekspos</h2>
          <p className="mt-0.5 text-sm text-slate-500">Temuan audit yang siap dikonfirmasi kepada pihak Auditee.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.6fr_1fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. PKA</span>
          <span>Objek Audit</span>
          <span>Tingkat Risiko</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredTemuan.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada temuan yang cocok.
            </div>
          )}
          {filteredTemuan.map((row, index) => (
            <div
              key={`${row.noPka}-${index}`}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.6fr_1fr_1fr_auto]"
            >
              <div className="truncate font-semibold text-blue-700">{row.noPka}</div>
              <div className="min-w-0 truncate text-slate-600">{row.objekAudit}</div>
              <span className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${ktRisikoBadgeClass(row.tingkatRisiko)}`}>
                {row.tingkatRisiko}
              </span>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              {row.status === 'Disanggah' ? (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  <FileSearch size={14} />
                  Lihat Klarifikasi
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
                >
                  <Info size={14} />
                  Lihat Detail
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Klarifikasi dari Auditee &ndash; TM/041/003</h2>

        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-slate-600">
            &ldquo;Kami sudah melakukan perbaikan checklist inspeksi sejak Juli 2026, mohon temuan ini di tinjau ulang
            dengan bukti pendukung terlampir.&rdquo;
          </p>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 sm:whitespace-nowrap"
          >
            <FileSearch size={14} />
            Lihat Dokumen Terlampir
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <X size={16} />
            Tolak Sanggahan
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <CheckCircle2 size={16} />
            Terima &amp; Perbarui Status
          </button>
        </div>
      </section>
    </KetuaTimShell>
  )
}
