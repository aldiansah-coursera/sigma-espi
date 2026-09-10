import { useMemo, useState } from 'react'
import { AlertTriangle, FileCheck2, Plus, Send } from 'lucide-react'
import { AuditorShell } from '../../components/auditor/AuditorShell'
import { auditorPrioritasBadgeClass, auditorStatusBadgeClass } from '../../components/auditor/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface Temuan {
  id: number
  kkaTerkait: string
  kondisi: string
  kriteria: string
  penyebab: string
  akibat: string
  prioritas: string
  status: string
}

const KKA_TERKAIT_OPTIONS = ['KKA-0231', 'KKA-0240', 'KKA-0198']
const PRIORITAS_OPTIONS = ['Tinggi', 'Sedang', 'Rendah']

// Data contoh (statis) -- formulasi temuan audit (KKPT: Kondisi, Kriteria,
// Penyebab, Akibat) oleh Auditor berdasarkan KKA yang sudah dikerjakan.
// Sisi backend belum dibangun; temuan baru dikirim ke Ketua Tim untuk
// direviu sebelum diteruskan ke Auditee.
const INITIAL_TEMUAN: Temuan[] = [
  {
    id: 1,
    kkaTerkait: 'KKA-0231',
    kondisi: 'Checklist inspeksi mesin tidak lengkap untuk 3 dari 10 unit.',
    kriteria: 'SOP Perawatan Mesin No. 04/SOP/2024 mewajibkan checklist diisi lengkap setiap inspeksi.',
    penyebab: 'Teknisi belum konsisten mengisi checklist digital setelah inspeksi selesai.',
    akibat: 'Riwayat perawatan mesin tidak dapat ditelusuri secara akurat.',
    prioritas: 'Tinggi',
    status: 'Menunggu Reviu Ketua Tim',
  },
  {
    id: 2,
    kkaTerkait: 'KKA-0240',
    kondisi: 'Dokumentasi kalibrasi alat ukur kurang lengkap untuk periode Q2 2026.',
    kriteria: 'Prosedur Kalibrasi mewajibkan sertifikat kalibrasi diarsipkan setiap periode.',
    penyebab: 'Arsip fisik belum dipindai ke sistem dokumen digital.',
    akibat: 'Sulit membuktikan validitas hasil pengukuran saat audit eksternal.',
    prioritas: 'Sedang',
    status: 'Diteruskan ke Auditee',
  },
]

function emptyForm() {
  return {
    kkaTerkait: KKA_TERKAIT_OPTIONS[0],
    kondisi: '',
    kriteria: '',
    penyebab: '',
    akibat: '',
    prioritas: PRIORITAS_OPTIONS[1],
  }
}

export function TemuanAuditKkptPage() {
  const [temuanList, setTemuanList] = useState<Temuan[]>(INITIAL_TEMUAN)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  const filteredTemuan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return temuanList
    return temuanList.filter((t) => t.kkaTerkait.toLowerCase().includes(q) || t.kondisi.toLowerCase().includes(q))
  }, [temuanList, searchQuery])

  const menungguReviu = temuanList.filter((t) => t.status === 'Menunggu Reviu Ketua Tim').length
  const prioritasTinggi = temuanList.filter((t) => t.prioritas === 'Tinggi').length
  const diteruskan = temuanList.filter((t) => t.status === 'Diteruskan ke Auditee').length

  function rumuskanTemuanBaru() {
    if (!form.kondisi.trim() || !form.kriteria.trim() || !form.penyebab.trim() || !form.akibat.trim()) {
      setFormError('Kondisi, Kriteria, Penyebab, dan Akibat wajib diisi.')
      return
    }
    setFormError('')
    setTemuanList((prev) => [
      {
        id: Date.now(),
        kkaTerkait: form.kkaTerkait,
        kondisi: form.kondisi.trim(),
        kriteria: form.kriteria.trim(),
        penyebab: form.penyebab.trim(),
        akibat: form.akibat.trim(),
        prioritas: form.prioritas,
        status: 'Menunggu Reviu Ketua Tim',
      },
      ...prev,
    ])
    setForm(emptyForm())
  }

  return (
    <AuditorShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari Temuan">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Merumuskan Temuan Audit (KKPT)</h1>
        <p className="mt-1 text-sm text-slate-500">Formulasi kondisi, kriteria, penyebab, dan akibat berdasarkan KKA.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Temuan Dirumuskan" value={menungguReviu} subtitle="Menunggu Reviu Ketua Tim" icon={FileCheck2} />
        <StatCard label="Prioritas Tinggi" value={prioritasTinggi} subtitle="Perlu Perhatian Segera" icon={AlertTriangle} badge={prioritasTinggi > 0 ? 'Urgent' : undefined} />
        <StatCard label="Diteruskan ke Auditee" value={diteruskan} subtitle="Sudah Dikonfirmasi Ketua Tim" icon={Send} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Temuan Saya</h2>
          <p className="mt-0.5 text-sm text-slate-500">Temuan audit yang telah Anda rumuskan berdasarkan KKA.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.8fr_1fr_1.2fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>KKA Terkait</span>
          <span>Kondisi</span>
          <span>Prioritas</span>
          <span>Status Konfirmasi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredTemuan.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada temuan yang cocok.
            </div>
          )}
          {filteredTemuan.map((t) => (
            <div
              key={t.id}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.8fr_1fr_1.2fr]"
            >
              <div className="truncate font-semibold text-blue-700">{t.kkaTerkait}</div>
              <div className="min-w-0 truncate text-slate-600">{t.kondisi}</div>
              <span className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${auditorPrioritasBadgeClass(t.prioritas)}`}>
                {t.prioritas}
              </span>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditorStatusBadgeClass(t.status)}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Formulasi Temuan (KKPT)</h2>
        <p className="mt-0.5 text-sm text-slate-500">Rumuskan temuan baru berdasarkan salah satu KKA yang sudah Anda kerjakan.</p>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">KKA Terkait</label>
            <select
              value={form.kkaTerkait}
              onChange={(e) => setForm((prev) => ({ ...prev, kkaTerkait: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {KKA_TERKAIT_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Kondisi</label>
            <textarea
              value={form.kondisi}
              onChange={(e) => setForm((prev) => ({ ...prev, kondisi: e.target.value }))}
              rows={2}
              placeholder="Fakta/kondisi yang ditemukan di lapangan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Kriteria</label>
            <textarea
              value={form.kriteria}
              onChange={(e) => setForm((prev) => ({ ...prev, kriteria: e.target.value }))}
              rows={2}
              placeholder="Standar/SOP/ketentuan yang menjadi acuan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Penyebab</label>
            <textarea
              value={form.penyebab}
              onChange={(e) => setForm((prev) => ({ ...prev, penyebab: e.target.value }))}
              rows={2}
              placeholder="Akar penyebab terjadinya kondisi tersebut"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Akibat</label>
            <textarea
              value={form.akibat}
              onChange={(e) => setForm((prev) => ({ ...prev, akibat: e.target.value }))}
              rows={2}
              placeholder="Dampak atau risiko yang mungkin timbul"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Prioritas</label>
            <select
              value={form.prioritas}
              onChange={(e) => setForm((prev) => ({ ...prev, prioritas: e.target.value }))}
              className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {PRIORITAS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={rumuskanTemuanBaru}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Plus size={16} />
            Rumuskan Temuan Baru
          </button>
        </div>
      </section>
    </AuditorShell>
  )
}
