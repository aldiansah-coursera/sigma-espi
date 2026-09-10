import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Save, Send, UploadCloud } from 'lucide-react'
import { AuditeeShell } from '../../components/auditee/AuditeeShell'
import { auditeeStatusBadgeClass } from '../../components/auditee/statusBadge'

interface RencanaAksi {
  id: number
  temuan: string
  rencanaAksi: string
  tanggalKomitmen: string
  namaBukti: string
  status: string
}

const TEMUAN_TERKAIT_OPTIONS = ['TM/041/001', 'TM/041/003', 'TM/041/004']

// Data contoh (statis) -- riwayat rencana aksi & bukti perbaikan yang
// pernah diajukan Auditee. Sisi backend belum dibangun; entri baru dari
// form di bawah ditambahkan ke riwayat secara lokal.
const RIWAYAT_AWAL: RencanaAksi[] = [
  {
    id: 1,
    temuan: 'TM/041/002',
    rencanaAksi: 'Menetapkan mekanisme eskalasi otomatis pada proses pengadaan suku cadang yang mendekati batas SLA.',
    tanggalKomitmen: '2026-08-10',
    namaBukti: 'bukti-eskalasi-pengadaan.pdf',
    status: 'Diterima',
  },
]

function emptyForm() {
  return {
    temuanTerkait: TEMUAN_TERKAIT_OPTIONS[0],
    rencanaAksi: '',
    tanggalKomitmen: '',
    namaBukti: '',
  }
}

export function RencanaAksiBuktiPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [riwayat, setRiwayat] = useState<RencanaAksi[]>(RIWAYAT_AWAL)
  const [form, setForm] = useState(emptyForm())
  const [formMessage, setFormMessage] = useState('')

  const filteredRiwayat = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return riwayat
    return riwayat.filter((r) => r.temuan.toLowerCase().includes(q))
  }, [riwayat, searchQuery])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormMessage('Bukti perbaikan wajib berupa file PDF.')
      e.target.value = ''
      setForm((prev) => ({ ...prev, namaBukti: '' }))
      return
    }
    setFormMessage('')
    setForm((prev) => ({ ...prev, namaBukti: file.name }))
  }

  function simpanDraft() {
    if (!form.rencanaAksi.trim() || !form.tanggalKomitmen) {
      setFormMessage('Rencana aksi dan tanggal komitmen wajib diisi sebelum menyimpan draf.')
      return
    }
    setFormMessage('')
    setRiwayat((prev) => [
      { id: Date.now(), temuan: form.temuanTerkait, rencanaAksi: form.rencanaAksi, tanggalKomitmen: form.tanggalKomitmen, namaBukti: form.namaBukti || '-', status: 'Draft' },
      ...prev,
    ])
  }

  function kirimBukti() {
    if (!form.rencanaAksi.trim() || !form.tanggalKomitmen || !form.namaBukti) {
      setFormMessage('Rencana aksi, tanggal komitmen, dan bukti perbaikan wajib diisi sebelum dikirim.')
      return
    }
    setFormMessage('')
    setRiwayat((prev) => [
      { id: Date.now(), temuan: form.temuanTerkait, rencanaAksi: form.rencanaAksi, tanggalKomitmen: form.tanggalKomitmen, namaBukti: form.namaBukti, status: 'Menunggu Verifikasi' },
      ...prev,
    ])
    setForm(emptyForm())
  }

  return (
    <AuditeeShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari rencana aksi">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Rencana Aksi &amp; Bukti Perbaikan</h1>
        <p className="mt-1 text-sm text-slate-500">Susun rencana perbaikan atas temuan audit beserta bukti pelaksanaannya.</p>
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Ajukan Rencana Aksi</h2>
        <p className="mt-0.5 text-sm text-slate-500">Lengkapi rencana aksi, tanggal komitmen, dan unggah bukti perbaikan bila sudah tersedia.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Temuan Terkait</label>
            <select
              value={form.temuanTerkait}
              onChange={(e) => setForm((prev) => ({ ...prev, temuanTerkait: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {TEMUAN_TERKAIT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tanggal Komitmen</label>
            <input
              type="date"
              value={form.tanggalKomitmen}
              onChange={(e) => setForm((prev) => ({ ...prev, tanggalKomitmen: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Rencana Aksi</label>
            <textarea
              value={form.rencanaAksi}
              onChange={(e) => setForm((prev) => ({ ...prev, rencanaAksi: e.target.value }))}
              rows={3}
              placeholder="Jelaskan langkah perbaikan yang akan dilakukan"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Unggah Bukti Perbaikan</label>
            <label
              htmlFor="bukti-perbaikan-input"
              className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 py-6 text-center hover:border-blue-400"
            >
              <UploadCloud size={22} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-700">{form.namaBukti || 'Klik untuk memilih berkas'}</span>
              <span className="text-xs text-slate-400">Hanya file PDF, maksimal 10MB</span>
              <input id="bukti-perbaikan-input" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {formMessage && <p className="mt-4 text-sm font-semibold text-red-600">{formMessage}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={simpanDraft}
            className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300"
          >
            <Save size={16} />
            Simpan
          </button>
          <button
            type="button"
            onClick={kirimBukti}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Send size={16} />
            Kirim Bukti Perbaikan
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Rencana Aksi Sebelumnya</h2>
          <p className="mt-0.5 text-sm text-slate-500">Riwayat rencana aksi dan bukti perbaikan yang telah diajukan.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. Temuan</span>
          <span>Rencana Aksi</span>
          <span>Tanggal Komitmen</span>
          <span>Bukti</span>
          <span>Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredRiwayat.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada rencana aksi yang diajukan.
            </div>
          )}
          {filteredRiwayat.map((r) => (
            <div
              key={r.id}
              className="grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_2fr_1fr_1fr_1fr]"
            >
              <div className="truncate font-semibold text-blue-700">{r.temuan}</div>
              <div className="min-w-0 truncate text-slate-600">{r.rencanaAksi}</div>
              <div className="truncate text-xs text-slate-500">{r.tanggalKomitmen}</div>
              <div className="min-w-0 truncate text-xs text-slate-500">{r.namaBukti}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${auditeeStatusBadgeClass(r.status)}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AuditeeShell>
  )
}
