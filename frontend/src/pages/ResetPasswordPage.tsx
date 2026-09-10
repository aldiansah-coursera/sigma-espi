import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react'
import logoImage from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'
import { resetPassword } from '../services/authService'
import { extractErrorMessage } from '../lib/api'

// Sama dengan aturan di RegisterPage.tsx -- minimal 8 karakter, kombinasi
// huruf besar, huruf kecil, dan angka.
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setFieldError(null)

    if (!PASSWORD_STRENGTH_REGEX.test(password)) {
      setFieldError('Password minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan angka')
      return
    }
    if (password !== confirmPassword) {
      setFieldError('Konfirmasi password tidak sama dengan password')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, password)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Gagal reset password. Link mungkin sudah kedaluwarsa, silakan minta link baru.'),
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

        {!token ? (
          <div className="mt-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-8">
            <h1 className="text-xl font-bold text-white">Link tidak valid</h1>
            <p className="mt-2 text-sm text-red-100">
              Link reset password ini tidak lengkap. Silakan minta link baru lewat halaman Lupa Password.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-block rounded-xl bg-blue-50 px-6 py-2.5 text-sm font-semibold text-blue-800 hover:bg-white"
            >
              Minta Link Baru
            </Link>
          </div>
        ) : submitted ? (
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
            <CheckCircle2 size={40} className="mx-auto text-white" />
            <h1 className="mt-4 text-2xl font-bold text-white">Password berhasil diubah</h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Silakan masuk kembali menggunakan password baru Anda.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-xl bg-blue-50 px-6 py-2.5 text-sm font-semibold text-blue-800 hover:bg-white"
            >
              Ke halaman Masuk
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-7 text-3xl tracking-tight text-white">Buat password baru</h1>
            <p className="mt-2 text-sm text-blue-100">Masukkan password baru untuk akun SIGMA eSPI Anda.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left" noValidate>
              {(submitError || fieldError) && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-3.5 text-sm text-red-100">
                  {submitError ?? fieldError}
                </div>
              )}

              <div>
                <label htmlFor="password" className="sr-only">
                  Password baru
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password baru"
                    className="w-full rounded-2xl border border-white bg-transparent px-6 py-4 pr-12 text-base text-white placeholder:text-white/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-white"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Konfirmasi password baru
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-2xl border border-white bg-transparent px-6 py-4 text-base text-white placeholder:text-white/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-4 text-base font-semibold text-blue-800 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </>
        )}

        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-900/30 px-4 py-2 text-xs font-medium text-blue-100 backdrop-blur-sm">
            <ShieldCheck size={14} />
            Data terverifikasi aman
          </div>
        </div>
      </div>
    </div>
  )
}
