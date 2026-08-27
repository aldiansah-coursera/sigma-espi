import logoImage from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'

interface LoadingScreenProps {
  /** true saat sesi sudah selesai dipulihkan dan splash mulai menghilang. */
  fadingOut?: boolean
}

export function LoadingScreen({ fadingOut = false }: LoadingScreenProps) {
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-6 text-center transition-all duration-700 ease-in-out ${
        fadingOut ? 'opacity-0 blur-sm' : 'opacity-100 blur-none'
      }`}
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <img
        src={logoImage}
        alt="Dirgantara Indonesia - Indonesian Aerospace (IAe)"
        className="h-64 w-auto object-contain drop-shadow-2xl"
      />
    </div>
  )
}
