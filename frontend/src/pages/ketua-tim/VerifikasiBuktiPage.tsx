import { useState } from 'react'
import { CheckCircle2, Clock, FileText, RotateCcw, ShieldCheck } from 'lucide-react'
import { KetuaTimShell } from '../../components/ketua-tim/KetuaTimShell'
import { ktStatusBadgeClass } from '../../components/ketua-tim/statusBadge'
import { StatCard } from '../../components/ui/StatCard'

interface BuktiPerbaikan {
  id: number
  noTemuan: string
  objekAudit: string
  auditee: string
  tanggalUnggah: string
  status: string
  namaFile: string
  catatanPengembalian: string
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Verifikasi Bukti.
// Sisi backend belum dibangun, jadi halaman ini murni tampilan dulu.
// Bukti perbaikan diunggah oleh Auditee (berkas PDF), Ketua Tim di sini
// hanya meninjau berkas yang sudah ada -- bukan mengunggah.
const INITIAL_BUKTI: BuktiPerbaikan[] = [
  {
    id: 1,
    noTemuan: 'TM/041/001',
    objekAudit: 'Pengujian Mesin Hangar 3',
    auditee: 'Divisi Produksi Sayap',
    tanggalUnggah: '20 Agu 2026',
    status: 'Menunggu Verifikasi',
    namaFile: 'bukti-perbaikan-TM041001.pdf',
    catatanPengembalian: '',
  },
  {
    id: 2,
    noTemuan: 'TM/041/002',
    objekAudit: 'Pengujian Mesin Hangar 3',
    auditee: 'Divisi Produksi Sayap',
    tanggalUnggah: '18 Agu 2026',
    status: 'Diterima',
    namaFile: 'bukti-perbaikan-TM041002.pdf',
    catatanPengembalian: '',
  },
  {
    id: 3,
    noTemuan: 'TM/041/003',
    objekAudit: 'Verifikasi Dokumen Pengadaan Suku Cadang',
    auditee: 'Unit Pengadaan',
    tanggalUnggah: '15 Agu 2026',
    status: 'Dikembalikan',
    namaFile: 'bukti-perbaikan-TM041003.pdf',
    catatanPengembalian: 'Dokumen yang dilampirkan belum mencakup bukti serah terima suku cadang, mohon lengkapi.',
  },
]

function aksiLabel(status: string): string {
  if (status === 'Menunggu Verifikasi') return 'Verifikasi'
  if (status === 'Diterima') return 'Lihat Bukti'
  return 'Lihat Catatan'
}

export function VerifikasiBuktiPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [buktiList, setBuktiList] = useState<BuktiPerbaikan[]>(INITIAL_BUKTI)
  const [selectedId, setSelectedId] = useState<number>(INITIAL_BUKTI[0].id)
  const [catatanInput, setCatatanInput] = useState('')
  const [formError, setFormError] = useState('')

  const filteredBukti = buktiList.filter((row) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      row.noTemuan.toLowerCase().includes(q) ||
      row.objekAudit.toLowerCase().includes(q) ||
      row.auditee.toLowerCase().includes(q)
    )
  })

  const selected = buktiList.find((row) => row.id === selectedId) ?? buktiList[0]

  const menungguCount = buktiList.filter((row) => row.status === 'Menunggu Verifikasi').length
  const diterimaCount = buktiList.filter((row) => row.status === 'Diterima').length
  const dikembalikanCount = buktiList.filter((row) => row.status === 'Dikembalikan').length

  function pilihBaris(id: number) {
    setSelectedId(id)
    setCatatanInput('')
    setFormError('')
  }

  function terimaBukti() {
    setBuktiList((prev) =>
      prev.map((row) => (row.id === selected.id ? { ...row, status: 'Diterima', catatanPengembalian: '' } : row)),
    )
    setCatatanInput('')
    setFormError('')
  }

  function kembalikanBukti() {
    if (!catatanInput.trim()) {
      setFormError('Catatan pengembalian wajib diisi agar Auditee tahu apa yang perlu diperbaiki.')
      return
    }
    setBuktiList((prev) =>
      prev.map((row) =>
        row.id === selected.id ? { ...row, status: 'Dikembalikan', catatanPengembalian: catatanInput.trim() } : row,
      ),
    )
    setCatatanInput('')
    setFormError('')
  }

  return (
    <KetuaTimShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari bukti audit">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Verifikasi Bukti</h1>
        <p className="mt-1 text-sm text-slate-500">Verifikasi kelengkapan dan keabsahan bukti perbaikan yang diunggah Auditee.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Bukti Menunggu Verifikasi" value={menungguCount} subtitle="Rencana Aksi dari Auditee" icon={Clock} />
        <StatCard label="Bukti Diterima" value={diterimaCount} subtitle="Temuan Selesai Ditindaklanjuti" icon={CheckCircle2} />
        <StatCard label="Bukti Dikembalikan" value={dikembalikanCount} subtitle="Perlu Revisi" icon={RotateCcw} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Bukti Perbaikan Auditee</h2>
          <p className="mt-0.5 text-sm text-slate-500">Berkas bukti tindak lanjut temuan yang diunggah oleh Auditee.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.6fr_1.2fr_1fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>No. Temuan</span>
          <span>Objek Audit</span>
          <span>Auditee</span>
          <span>Tanggal Unggah</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {filteredBukti.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada bukti yang cocok.
            </div>
          )}
          {filteredBukti.map((row) => (
            <div
              key={row.id}
              className={`grid min-w-0 grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.6fr_1.2fr_1fr_1fr_auto] ${
                row.id === selected.id ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="truncate font-semibold text-blue-700">{row.noTemuan}</div>
              <div className="min-w-0 truncate text-slate-600">{row.objekAudit}</div>
              <div className="truncate text-slate-600">{row.auditee}</div>
              <div className="truncate text-xs text-slate-500">{row.tanggalUnggah}</div>
              <span className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${ktStatusBadgeClass(row.status)}`}>
                {row.status}
              </span>
              <button
                type="button"
                onClick={() => pilihBaris(row.id)}
                className="inline-flex w-fit items-center gap-1.5 justify-self-end rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                <ShieldCheck size={14} />
                {aksiLabel(row.status)}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Verifikasi Berkas Perbaikan &ndash; {selected.noTemuan}</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {selected.objekAudit} &middot; Diunggah oleh {selected.auditee} pada {selected.tanggalUnggah}
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{selected.namaFile}</p>
            <p className="text-xs text-slate-400">Berkas PDF bukti perbaikan dari Auditee (baca saja)</p>
          </div>
        </div>

        {selected.status === 'Menunggu Verifikasi' ? (
          <>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                Catatan (wajib diisi jika bukti dikembalikan)
              </label>
              <textarea
                value={catatanInput}
                onChange={(e) => setCatatanInput(e.target.value)}
                rows={3}
                placeholder="Jelaskan kekurangan bukti yang perlu diperbaiki Auditee"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {formError && <p className="mt-3 text-sm font-semibold text-red-600">{formError}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={kembalikanBukti}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <RotateCcw size={16} />
                Kembalikan untuk Perbaikan
              </button>
              <button
                type="button"
                onClick={terimaBukti}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} />
                Terima &mdash; Tandai Selesai
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            {selected.status === 'Diterima' ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} />
                Bukti sudah diverifikasi dan diterima. Temuan ini selesai ditindaklanjuti.
              </p>
            ) : (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <RotateCcw size={16} />
                  Bukti dikembalikan untuk diperbaiki Auditee.
                </p>
                <p className="mt-1.5 text-sm text-slate-600">{selected.catatanPengembalian}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </KetuaTimShell>
  )
}
