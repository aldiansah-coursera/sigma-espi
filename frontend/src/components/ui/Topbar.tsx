import { useRef, useState } from 'react'
import { Bell, Menu, Search, User as UserIcon, LogOut, X } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { roleLabel } from '../../lib/roles'

interface TopbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  pendingCount?: number
  hasUnreadPending?: boolean
  onNotifOpen?: () => void
  /** Buka panel Sidebar di layar < lg. Tombol hamburger cuma tampil kalau prop ini diisi. */
  onMenuClick?: () => void
}

export function Topbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  pendingCount = 0,
  hasUnreadPending = false,
  onNotifOpen = () => {},
  onMenuClick,
}: TopbarProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Buka menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="relative min-w-0 max-w-md flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border-2 border-blue-500 bg-[#e7ebf6] py-2.5 pl-11 pr-10 text-sm text-slate-700 placeholder:text-slate-400 transition-colors duration-200 hover:border-blue-700 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('')
                searchInputRef.current?.focus()
              }}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-blue-800 px-3 py-2.5 text-xs font-bold text-white sm:px-5 sm:text-sm">
          {user ? roleLabel(user.role) : 'Admin'}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const opening = !notifOpen
              setNotifOpen(opening)
              if (opening) onNotifOpen()
            }}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell size={20} />
            {hasUnreadPending && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="px-1 text-sm font-semibold text-slate-800">Notifikasi</p>
                {pendingCount > 0 ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                    {pendingCount} pendaftar baru menunggu persetujuan.
                  </p>
                ) : (
                  <p className="mt-2 px-3 py-2.5 text-sm text-slate-400">Tidak ada notifikasi baru.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Menu akun"
          >
            <UserIcon size={18} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="truncate text-sm font-semibold text-slate-800">{user?.nama ?? 'Admin'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email ?? '-'}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
