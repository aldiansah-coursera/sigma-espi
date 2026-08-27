import type { LucideIcon } from 'lucide-react'
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
}

export function Sidebar({ navItems }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className="fixed left-0 z-20 flex w-72 flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat px-5 py-8"
      style={{ backgroundImage: `url(${loginBg})`, top: '-2px', bottom: '-2px' }}
    >
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
  )
}
