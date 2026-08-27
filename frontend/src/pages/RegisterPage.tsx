import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, LoaderCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import logoImage from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'
import { getRegisterUnits, register } from '../services/authService'
import { extractErrorMessage } from '../lib/api'

interface FormState {
  nip: string
  namaLengkap: string
  email: string
  nomorWhatsapp: string
  unitKerja: string
  password: string
}

const EMPTY_FORM: FormState = {
  nip: '',
  namaLengkap: '',
  email: '',
  nomorWhatsapp: '',
  unitKerja: 'Kantor Pusat',
  password: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.nip.trim()) {
    errors.nip = 'NIP wajib diisi'
  } else if (form.nip.replace(/\D/g, '').length < 8) {
    errors.nip = 'NIP tidak valid'
  }

  if (!form.namaLengkap.trim()) {
    errors.namaLengkap = 'Nama lengkap wajib diisi'
  } else if (form.namaLengkap.trim().length < 3) {
    errors.namaLengkap = 'Nama lengkap terlalu pendek'
  }

  if (!form.email.trim()) {
    errors.email = 'Email perusahaan wajib diisi'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid'
  }

  if (!form.nomorWhatsapp.trim()) {
    errors.nomorWhatsapp = 'Nomor WhatsApp wajib diisi'
  } else if (form.nomorWhatsapp.replace(/\D/g, '').length < 9) {
    errors.nomorWhatsapp = 'Nomor WhatsApp tidak valid'
  }

  if (!form.password) {
    errors.password = 'Password wajib diisi'
  } else if (form.password.length < 8) {
    errors.password = 'Password minimal 8 karakter'
  }

  return errors
}

export function RegisterPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [units, setUnits] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRegisterUnits().then((list) => {
      if (cancelled) return
      setUnits(list)
      setForm((prev) => (list.includes(prev.unitKerja) ? prev : { ...prev, unitKerja: list[0] ?? prev.unitKerja }))
    })
    return () => {
      cancelled = true
    }
  }, [])

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await register({
        nip: form.nip.trim(),
        namaLengkap: form.namaLengkap.trim(),
        email: form.email.trim(),
        nomorWhatsapp: form.nomorWhatsapp.trim(),
        unitKerja: form.unitKerja,
        password: form.password,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(
        extractErrorMessage(
          err,
          'Pendaftaran belum dapat diproses. Endpoint pendaftaran belum tersedia di backend — silakan hubungi Admin SIGMA.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden w-1/2 flex-col justify-between bg-cover bg-center bg-no-repeat p-10 text-white lg:flex"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Logo SIGMA eSPI" className="h-16 w-16 object-contain" />
          <span className="text-2xl font-bold">SIGMA eSPI</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
            PT Dirgantara Indonesia
          </p>
          <p className="mt-3 text-4xl font-bold leading-tight">
            Mulai berkolaborasi dalam audit yang lebih terarah.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/80">
            Daftarkan akun Anda untuk mendapatkan akses terkelola ke ekosistem audit internal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
          <ShieldCheck size={14} />
          Identitas diverifikasi oleh Admin
        </div>
      </div>

      <div className="flex w-full items-center justify-center overflow-y-auto bg-white px-4 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logoImage} alt="Logo SIGMA eSPI" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold text-blue-950">SIGMA eSPI</span>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">Pendaftaran terkirim</h2>
              <p className="mt-2 text-sm text-slate-600">
                Akun Anda menunggu persetujuan dan penetapan role oleh Admin. Anda akan dapat
                masuk setelah akun diaktifkan.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Kembali ke halaman Masuk
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-blue-950">Pendaftaran akun</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Lengkapi data berikut untuk mengajukan akses akun
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <Field
                  id="nip"
                  label="NIP (Required)"
                  value={form.nip}
                  onChange={(v) => updateField('nip', v)}
                  placeholder="Masukkan NIP"
                  error={errors.nip}
                />

                <Field
                  id="namaLengkap"
                  label="Nama Lengkap"
                  value={form.namaLengkap}
                  onChange={(v) => updateField('namaLengkap', v)}
                  placeholder="Nama sesuai identitas PTDI"
                  error={errors.namaLengkap}
                />

                <Field
                  id="email"
                  label="Email Perusahaan"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  placeholder="nama@gmail.com"
                  error={errors.email}
                />

                <Field
                  id="nomorWhatsapp"
                  label="Nomor WhatsApp"
                  type="tel"
                  value={form.nomorWhatsapp}
                  onChange={(v) => updateField('nomorWhatsapp', v)}
                  placeholder="Masukkan Nomor WhatsApp Aktif"
                  error={errors.nomorWhatsapp}
                />

                <div>
                  <label htmlFor="unitKerja" className="mb-1.5 block text-sm font-bold text-blue-950">
                    Unit Kerja
                  </label>
                  <div className="relative">
                    <select
                      id="unitKerja"
                      value={form.unitKerja}
                      onChange={(e) => updateField('unitKerja', e.target.value)}
                      disabled={units.length === 0}
                      className="w-full appearance-none rounded-2xl border border-blue-900/15 bg-slate-50 px-5 py-3.5 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {units.length === 0 ? (
                        <option value={form.unitKerja}>Memuat unit kerja...</option>
                      ) : (
                        units.map((unitName) => (
                          <option key={unitName} value={unitName}>
                            {unitName}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(v) => updateField('password', v)}
                  placeholder="Buat Password"
                  error={errors.password}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Sudah memiliki akun?{' '}
                <Link to="/login" className="font-semibold text-blue-700 hover:underline">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
}

function Field({ id, label, value, onChange, type = 'text', placeholder, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-blue-950">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-slate-50 px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
            : 'border-blue-900/15 focus:border-blue-600 focus:ring-blue-100'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
