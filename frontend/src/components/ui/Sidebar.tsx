import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import logoImage from '../../assets/logo.png'
import loginBg from '../../assets/login-bg.jpg'

export interface SidebarNavItem {
  label: string
  icon: LucideIcon
  path: string
}

interface SidebarProps {
  navItems: SidebarNavItem[]
  /** Terbuka sebagai panel geser di layar < lg. Diabaikan di layar >= lg (selalu tampil). */
  isOpen: boolean
  /** Dipanggil saat backdrop, tombol X, atau salah satu menu di-klik (di layar < lg). */
  onClose: () => void
}

export function Sidebar({ navItems, isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Backdrop gelap di belakang panel -- cuma tampil di mobile/tablet saat panel terbuka. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 z-40 flex w-72 flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat px-5 py-8 transition-transform duration-300 ease-in-out lg:z-20 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundImage: `url(${loginBg})`, top: '-2px', bottom: '-2px' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>

        <div>
          <img src={logoImage} alt="Logo SIGMA eSPI" className="mx-auto h-36 w-auto object-contain" />

          <nav className="mt-10 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white backdrop-blur-sm'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="text-center">
          <p className="text-sm font-bold tracking-wide text-white">SIGMA eSPI</p>
          <p className="text-[11px] font-medium text-blue-100/70">PT.ID - INDONESIA</p>
        </div>
      </aside>
    </>
  )
}
