import { useState } from 'react'
import { CheckCircle2, Send, Star } from 'lucide-react'
import { AuditeeShell } from '../../components/auditee/AuditeeShell'

// Halaman survei kepuasan audit -- diisi Auditee setelah penugasan audit
// selesai. Sisi backend belum dibangun; pengiriman survei disimulasikan
// secara lokal (state submitted).
const PENUGASAN_AKTIF = 'STA/041/007 -- Audit Kepatuhan Prosedur K3 (selesai 25 Agustus 2026)'

export function SurveiKepuasanPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [komentar, setKomentar] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  function kirimSurvei() {
    if (rating === 0) {
      setFormError('Silakan berikan rating bintang sebelum mengirim survei.')
      return
    }
    setFormError('')
    setSubmitted(true)
  }

  return (
    <AuditeeShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari penugasan">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Survei Kepuasan Audit</h1>
        <p className="mt-1 text-sm text-slate-500">Berikan penilaian Anda atas pelaksanaan audit yang telah selesai dilakukan.</p>
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </span>
            <h2 className="text-lg font-bold text-blue-950">Terima Kasih atas Tanggapan Anda</h2>
            <p className="max-w-md text-sm text-slate-500">
              Survei kepuasan untuk penugasan {PENUGASAN_AKTIF} telah berhasil dikirim dan akan menjadi masukan untuk peningkatan kualitas audit berikutnya.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-blue-950">Formulir Survei</h2>
            <p className="mt-0.5 text-sm text-slate-500">Penilaian bersifat rahasia dan hanya digunakan untuk evaluasi internal SPI.</p>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Penugasan</label>
              <p className="mt-1.5 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm">{PENUGASAN_AKTIF}</p>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Penilaian Keseluruhan</label>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5"
                    aria-label={`Beri rating ${star} bintang`}
                  >
                    <Star
                      size={30}
                      className={(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
                {rating > 0 && <span className="ml-2 text-sm font-semibold text-slate-600">{rating} / 5</span>}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Komentar (opsional)</label>
              <textarea
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                rows={4}
                placeholder="Bagikan masukan Anda mengenai pelaksanaan audit"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={kirimSurvei}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                <Send size={16} />
                Kirim Tanggapan Survei
              </button>
            </div>
          </>
        )}
      </section>
    </AuditeeShell>
  )
}
