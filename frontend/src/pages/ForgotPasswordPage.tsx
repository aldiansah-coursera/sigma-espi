import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Info, LoaderCircle, MailCheck, ShieldCheck, X } from 'lucide-react'
import logoImage from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'
import { requestPasswordReset } from '../services/authService'
import { extractErrorMessage } from '../lib/api'

const GUIDE_STEPS = [
  'Masukkan email akun SIGMA eSPI Anda di form ini, lalu klik "Kirim Link Reset".',
  'Buka aplikasi atau website Gmail dari email pribadi yang terdaftar.',
  'Cek kotak masuk (inbox) untuk email berjudul "Reset Password SIGMA eSPI".',
  'Tidak ada di kotak masuk? Cek folder Spam atau Promosi -- kadang email otomatis masuk ke sana.',
  'Buka email tersebut, lalu klik link reset password yang ada di dalamnya.',
  'Isi password baru & konfirmasi (minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan angka).',
  'Klik simpan, lalu kembali ke halaman Masuk dan login dengan password baru.',
]

const GUIDE_NOTES = [
  'Link reset password hanya berlaku selama 1 jam sejak email dikirim.',
  'Setiap link hanya bisa dipakai satu kali.',
  'Kalau email yang dimasukkan belum terdaftar, sistem akan menampilkan pesan error -- pastikan email yang diketik sama persis dengan yang dipakai saat mendaftar.',
  'Sudah menunggu beberapa menit dan email tetap tidak ada? Hubungi Admin SIGMA eSPI.',
]

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      // Backend memvalidasi bahwa email harus benar-benar terdaftar --
      // kalau tidak ketemu, backend melempar error (ditangani di blok
      // catch di bawah) dan submitted TIDAK di-set true.
      setSubmitted(true)
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Email tidak terdaftar di sistem SIGMA eSPI. Pastikan akun Anda sudah terdaftar.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-16"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="relative z-10 w-full max-w-lg text-center">
        <img
          src={logoImage}
          alt="Dirgantara Indonesia - Indonesian Aerospace (IAe)"
          className="mx-auto h-40 w-auto object-contain"
        />

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
            <MailCheck size={40} className="mx-auto text-white" />
            <h1 className="mt-4 text-2xl font-bold text-white">Cek email Anda</h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Kami sudah kirim link reset password ke <span className="font-semibold text-white">{email}</span>.
              Link berlaku selama 1 jam.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-blue-50 px-6 py-2.5 text-sm font-semibold text-blue-800 hover:bg-white"
            >
              Kembali ke halaman Masuk
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-7 flex items-center justify-center gap-2">
              <h1 className="text-3xl tracking-tight text-white">Lupa password?</h1>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                title="Panduan reset password"
                aria-label="Lihat panduan reset password"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 text-white/90 transition-colors hover:bg-white/10"
              >
                <Info size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Masukkan email akun Anda, kami akan kirim link untuk membuat password baru.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left" noValidate>
              {error && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-3.5 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-white bg-transparent px-6 py-4 text-base text-white placeholder:text-white/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-4 text-base font-semibold text-blue-800 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-blue-100">
              Ingat password Anda?{' '}
              <Link to="/login" className="font-semibold text-white hover:underline">
                Kembali ke Masuk
              </Link>
            </p>
          </>
        )}

        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-900/30 px-4 py-2 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <ShieldCheck size={14} />
            Data terverifikasi aman
          </div>
        </div>
      </div>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Info size={18} />
                </div>
                <h2 className="text-lg font-bold text-blue-950">Panduan Reset Password</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan"
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Ikuti langkah-langkah berikut untuk membuat password baru lewat email pribadi Anda.
            </p>

            <ol className="mt-5 space-y-3.5">
              {GUIDE_STEPS.map((textStep, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600">{textStep}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-900">Perlu diperhatikan</p>
              <ul className="mt-2 space-y-1.5">
                {GUIDE_NOTES.map((note, index) => (
                  <li key={index} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
