import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { FileCheck2, Lock, Plus, Send, UploadCloud } from 'lucide-react'
import { AuditorShell } from '../../components/auditor/AuditorShell'
import { auditorStatusBadgeClass } from '../../components/auditor/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface KkaItem {
  id: number
  prosedur: string
  bukti: string
  status: string
  terkunci: boolean
  tglDibuat: string
  catatanKunjungan: string
}

const PENUGASAN_OPTIONS = ['ST/2026/014 -- Divisi Produksi Sayap', 'ST/2026/012 -- Unit Pengadaan']

// Data contoh (statis) -- pencatatan hasil pemeriksaan lapangan Auditor
// sendiri (bukan seluruh tim, lihat Pelaksanaan & KKA milik Ketua Tim).
// Sisi backend belum dibangun. KKA yang sudah divalidasi Pengawas Tim
// otomatis "terkunci" dan tidak bisa diedit lagi dari halaman ini.
const INITIAL_KKA: KkaItem[] = [
  {
    id: 1,
    prosedur: 'Pengujian Checklist Inspeksi Mesin',
    bukti: 'bukti-01.pdf',
    status: 'Terkunci',
    terkunci: true,
    tglDibuat: '12 Agu 2026',
    catatanKunjungan: 'Observasi checklist inspeksi mesin Hangar 3, ditemukan 3 unit belum tercatat perawatan berkala.',
  },
  {
    id: 2,
    prosedur: 'Verifikasi Kalibrasi Alat Ukur',
    bukti: 'bukti-02.pdf',
    status: 'Divalidasi',
    terkunci: true,
    tglDibuat: '10 Agu 2026',
    catatanKunjungan: 'Verifikasi sertifikat kalibrasi alat ukur, seluruh alat dalam masa berlaku.',
  },
  {
    id: 3,
    prosedur: 'Pemeriksaan Dokumentasi Prosedur',
    bukti: 'bukti-03.pdf',
    status: 'Draft',
    terkunci: false,
    tglDibuat: '09 Agu 2026',
    catatanKunjungan: 'Menunggu kelengkapan dokumen SOP dari unit terkait.',
  },
]

function emptyForm() {
  return {
    penugasan: PENUGASAN_OPTIONS[0],
    catatanKunjungan: '',
    prosedur: '',
    namaBukti: '',
  }
}

export function PemeriksaanLapanganKkaPage() {
  const [kkaList, setKkaList] = useState<KkaItem[]>(INITIAL_KKA)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  const filteredKka = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return kkaList
    return kkaList.filter((k) => k.prosedur.toLowerCase().includes(q))
  }, [kkaList, searchQuery])

  const terkunciCount = kkaList.filter((k) => k.status === 'Terkunci').length
  const draftCount = kkaList.filter((k) => k.status === 'Draft').length

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Bukti audit wajib berupa file PDF.')
      e.target.value = ''
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    setFormError('')
    setForm((prev) => ({ ...prev, namaBukti: file.name }))
  }

  function validateForm(): boolean {
    if (!form.prosedur.trim() || !form.catatanKunjungan.trim()) {
      setFormError('Prosedur dan catatan kunjungan lapangan wajib diisi.')
      return false
    }
    setFormError('')
    return true
  }

  function simpanDraft() {
    if (!validateForm()) return
    setKkaList((prev) => [
      {
        id: Date.now(),
        prosedur: form.prosedur.trim(),
        bukti: form.namaBukti || '-',
        status: 'Draft',
        terkunci: false,
        tglDibuat: 'Hari ini',
        catatanKunjungan: form.catatanKunjungan.trim(),
      },
      ...prev,
    ])
    setForm(emptyForm())
  }

  function kirimKeKetuaTim() {
    if (!validateForm()) return
    if (!form.namaBukti) {
      setFormError('Unggah bukti audit terlebih dahulu sebelum mengirim ke Ketua Tim.')
      return
    }
    setKkaList((prev) => [
      {
        id: Date.now(),
        prosedur: form.prosedur.trim(),
        bukti: form.namaBukti,
        status: 'Divalidasi',
        terkunci: true,
        tglDibuat: 'Hari ini',
        catatanKunjungan: form.catatanKunjungan.trim(),
      },
      ...prev,
    ])
    setForm(emptyForm())
  }

  return (
    <AuditorShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari KKA">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Pemeriksaan Lapangan &amp; Input KKA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pencatatan hasil kunjungan lapangan dan unggah bukti audit ke Kertas Kerja Audit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="KKA Terkunci" value={terkunciCount} subtitle="Sudah Divalidasi Pengawas" icon={Lock} />
        <StatCard label="KKA Draft" value={draftCount} subtitle="Menunggu Dikirim ke Ketua Tim" icon={FileCheck2} />
        <StatCard label="Bukti Terunggah" value={`${kkaList.filter((k) => k.bukti !== '-').length} File`} subtitle="PDF & Gambar Lapangan" icon={UploadCloud} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar KKA Saya</h2>
          <p className="mt-0.5 text-sm text-slate-500">Kertas Kerja Audit hasil pemeriksaan lapangan Anda sendiri.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1.4fr_1fr_1fr_0.7fr_1fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Prosedur</span>
          <span>Bukti</span>
          <span>Status</span>
          <span>Kunci</span>
          <span>Tgl. Dibuat</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredKka.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada KKA yang cocok.
            </div>
          )}
          {filteredKka.map((k) => (
            <div
              key={k.id}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.4fr_1fr_1fr_0.7fr_1fr]"
            >
              <div className="min-w-0 truncate font-semibold text-slate-800">{k.prosedur}</div>
              <div className="truncate text-xs text-slate-500">{k.bukti}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditorStatusBadgeClass(k.status)}`}>
                {k.status}
              </span>
              <div className="text-slate-500">{k.terkunci ? <Lock size={15} className="text-emerald-600" /> : '--'}</div>
              <div className="truncate text-xs text-slate-500">{k.tglDibuat}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Lakukan Pemeriksaan &amp; Input KKA Baru</h2>
        <p className="mt-0.5 text-sm text-slate-500">Catat hasil kunjungan lapangan, lalu simpan sebagai draf atau kirim ke Ketua Tim.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Penugasan</label>
            <select
              value={form.penugasan}
              onChange={(e) => setForm((prev) => ({ ...prev, penugasan: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {PENUGASAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Prosedur</label>
            <input
              type="text"
              value={form.prosedur}
              onChange={(e) => setForm((prev) => ({ ...prev, prosedur: e.target.value }))}
              placeholder="Contoh: Pengujian Checklist Inspeksi Mesin"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Catatan Kunjungan Lapangan</label>
            <textarea
              value={form.catatanKunjungan}
              onChange={(e) => setForm((prev) => ({ ...prev, catatanKunjungan: e.target.value }))}
              rows={3}
              placeholder="Jelaskan hasil observasi dan kondisi yang ditemukan di lapangan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Unggah Bukti Audit</label>
            <label
              htmlFor="bukti-audit-input"
              className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 py-6 text-center hover:border-blue-400"
            >
              <UploadCloud size={22} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-700">{form.namaBukti || 'Klik untuk memilih berkas'}</span>
              <span className="text-xs text-slate-400">Hanya file PDF, maksimal 10MB (file_bukti_url)</span>
              <input id="bukti-audit-input" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={simpanDraft}
            className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300"
          >
            <Plus size={16} />
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={kirimKeKetuaTim}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Send size={16} />
            Kirim ke Ketua Tim
          </button>
        </div>
      </section>
    </AuditorShell>
  )
}
