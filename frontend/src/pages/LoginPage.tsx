import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, LoaderCircle } from 'lucide-react'
import logoImage from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'
import { useAuth } from '../context/useAuth'
import { extractErrorMessage } from '../lib/api'
import { resolveHomeRoute } from '../lib/roles'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visible, setVisible] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Fade-in cepat begitu halaman Login pertama kali muncul (mis. setelah
  // splash screen selesai), bukan langsung nongol mendadak.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function focusPasswordOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordInputRef.current?.focus()
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedInUser = await login(email, password)
      navigate(resolveHomeRoute(loggedInUser.role), { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal masuk. Silakan coba lagi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-16 transition-opacity duration-300 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="relative z-10 w-full max-w-lg text-center">
        <img
          src={logoImage}
          alt="Dirgantara Indonesia - Indonesian Aerospace (IAe)"
          className="mx-auto h-48 w-auto object-contain"
        />

        <h1 className="mt-7 text-4xl tracking-tight text-white">Hai, selamat datang!</h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5 text-left" noValidate>
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
              onKeyDown={focusPasswordOnEnter}
              placeholder="Email"
              className="w-full rounded-2xl border border-white bg-transparent px-6 py-4 text-base text-white placeholder:text-white/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-4 text-base font-semibold text-blue-800 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-blue-100">
          Belum memiliki akun?{' '}
          <Link to="/register" className="font-semibold text-white hover:underline">
            Daftar Sekarang
          </Link>
        </p>

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
