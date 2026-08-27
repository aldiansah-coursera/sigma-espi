import { useEffect, useMemo, useState } from 'react'
import { Users, Clock, ShieldCheck, Check, X, Pencil, Trash2, UserCircle2 } from 'lucide-react'
import { Sidebar } from '../../components/ui/Sidebar'
import type { SidebarNavItem } from '../../components/ui/Sidebar'
import { Topbar } from '../../components/ui/Topbar'
import { useAuth } from '../../context/useAuth'
import { StatCard } from '../../components/ui/StatCard'
import { Switch } from '../../components/ui/Switch'
import type { ActiveUser, PendingUser } from '../../services/userService'
import {
  approvePendingUser,
  availableRoleNames,
  changeActiveUserRole,
  changeActiveUserUnit,
  deleteActiveUser,
  getActiveUsers,
  getPendingUsers,
  getUnits,
  rejectPendingUser,
  setPendingUserRole,
  toggleActiveUserStatus,
} from '../../services/userService'

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [{ label: 'Kelola User & Role', icon: Users, path: '/admin/dashboard' }]

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function AdminDashboardPage() {
  const { user: currentUser } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [draftRole, setDraftRole] = useState('')
  const [draftUnit, setDraftUnit] = useState('')
  const [availableUnits, setAvailableUnits] = useState<string[]>([])
  const [seenPendingIds, setSeenPendingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pending, active, units] = await Promise.all([getPendingUsers(), getActiveUsers(), getUnits()])
      if (cancelled) return
      setPendingUsers(pending)
      setActiveUsers(active)
      setAvailableUnits(units)
      setIsLoading(false)
    }
    void load()
    const interval = setInterval(() => {
      void Promise.all([getPendingUsers(), getActiveUsers()]).then(([pending, active]) => {
        if (cancelled) return
        setPendingUsers(pending)
        setActiveUsers(active)
      })
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Sembunyikan akun admin yang sedang login dari daftar & statistik —
  // akun tetap ada & berfungsi penuh di sistem, cuma tidak ditampilkan di sini.
  const visibleActiveUsers = useMemo(
    () => activeUsers.filter((u) => u.id !== currentUser?.userId),
    [activeUsers, currentUser],
  )
  const filteredPending = useMemo(
    () => pendingUsers.filter((u) => matchesQuery(searchQuery, u.nama, u.email, u.nip)),
    [pendingUsers, searchQuery],
  )
  const filteredActive = useMemo(
    () => visibleActiveUsers.filter((u) => matchesQuery(searchQuery, u.nama, u.email, u.nip)),
    [visibleActiveUsers, searchQuery],
  )
  const distinctRoleCount = useMemo(() => new Set(visibleActiveUsers.map((u) => u.role)).size, [visibleActiveUsers])
  const hasUnreadPending = pendingUsers.some((u) => !seenPendingIds.has(u.id))

  function markPendingNotifSeen() {
    setSeenPendingIds(new Set(pendingUsers.map((u) => u.id)))
  }

  async function handleSetRole(id: number, role: string) {
    setPendingUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    await setPendingUserRole(id, role)
  }

  async function handleSetUnit(id: number, unitKerja: string) {
    setPendingUsers((prev) => prev.map((u) => (u.id === id ? { ...u, unitKerja } : u)))
    await changeActiveUserUnit(id, unitKerja)
  }

  async function handleApprove(id: number) {
    const target = pendingUsers.find((u) => u.id === id)
    if (!target?.role) return
    setBusyId(id)
    try {
      await approvePendingUser(id)
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
      setActiveUsers((prev) => [
        ...prev,
        {
          id: target.id,
          nama: target.nama,
          email: target.email,
          nip: target.nip,
          noHp: target.noHp,
          unitKerja: target.unitKerja,
          role: target.role as string,
          aktif: true,
        },
      ])
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: number) {
    setBusyId(id)
    try {
      await rejectPendingUser(id)
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggle(id: number) {
    setActiveUsers((prev) => prev.map((u) => (u.id === id ? { ...u, aktif: !u.aktif } : u)))
    await toggleActiveUserStatus(id)
  }

  function startEditRole(id: number, currentRole: string, currentUnit: string) {
    setEditingRoleId(id)
    setDraftRole(currentRole)
    setDraftUnit(currentUnit)
  }

  async function confirmEditRole(id: number) {
    if (!draftRole || !draftUnit) return
    setBusyId(id)
    try {
      const target = activeUsers.find((u) => u.id === id)
      const tasks: Promise<void>[] = []
      if (target && target.role !== draftRole) tasks.push(changeActiveUserRole(id, draftRole))
      if (target && target.unitKerja !== draftUnit) tasks.push(changeActiveUserUnit(id, draftUnit))
      await Promise.all(tasks)
      setActiveUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: draftRole, unitKerja: draftUnit } : u)),
      )
      setEditingRoleId(null)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: number, nama: string) {
    if (!window.confirm(`Hapus akun ${nama}? Tindakan ini tidak dapat dibatalkan.`)) return
    setBusyId(id)
    try {
      await deleteActiveUser(id)
      setActiveUsers((prev) => prev.filter((u) => u.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  function focusRoleSelect(id: number) {
    document.getElementById(`role-select-${id}`)?.focus()
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <Sidebar navItems={ADMIN_NAV_ITEMS} />

      <div className="ml-72 flex h-screen min-w-0 flex-col overflow-hidden">
        <Topbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari NIP atau Nama"
          pendingCount={pendingUsers.length}
          hasUnreadPending={hasUnreadPending}
          onNotifOpen={markPendingNotifSeen}
        />

        <main className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">
              Persetujuan &amp; Manajemen Hak Akses User (RBAC)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola pendaftaran akun, penetapan role, dan status keaktifan pengguna.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Pengguna" value={visibleActiveUsers.length} icon={Users} />
            <StatCard
              label="Menunggu Persetujuan"
              value={pendingUsers.length}
              icon={Clock}
              badge={pendingUsers.length > 0 ? 'Pending' : undefined}
            />
            <StatCard label="Role Aktif" value={distinctRoleCount} icon={ShieldCheck} />
          </div>

          <section className="rounded-2xl bg-[#e7ebf6] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-blue-950">Persetujuan Pendaftaran Akun Baru</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Berikut adalah daftar akun yang baru didaftarkan dan memerlukan verifikasi serta pemberian hak akses role
                </p>
              </div>
              <span className="whitespace-nowrap rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-white">
                {pendingUsers.length} Permintaan
              </span>
            </div>

            <div className="mt-5 hidden grid-cols-[1.2fr_1.6fr_1fr_0.9fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
              <span>NIP &amp; Nama</span>
              <span>Email &amp; No HP</span>
              <span>Unit Kerja</span>
              <span>Set Role</span>
              <span>Status</span>
              <span className="text-right">Aksi</span>
            </div>

            <div className="mt-3 space-y-3">
              {!isLoading && filteredPending.length === 0 && (
                <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
                  Tidak ada pendaftaran yang menunggu persetujuan.
                </div>
              )}
              {filteredPending.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.2fr_1.6fr_1fr_0.9fr_0.8fr_auto]"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{u.nama}</div>
                    <div className="text-xs text-slate-400">{u.nip}</div>
                  </div>
                  <div>
                    <div className="text-slate-700">{u.email}</div>
                    <div className="text-xs text-slate-400">{u.noHp}</div>
                  </div>
                  <select
                    value={u.unitKerja}
                    onChange={(e) => void handleSetUnit(u.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {availableUnits.map((unitName) => (
                      <option key={unitName} value={unitName}>
                        {unitName}
                      </option>
                    ))}
                  </select>
                  <select
                    id={`role-select-${u.id}`}
                    value={u.role ?? ''}
                    onChange={(e) => void handleSetRole(u.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Pilih Role
                    </option>
                    {availableRoleNames().map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <span className="inline-flex w-fit rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>
                  <div className="flex gap-2 sm:justify-self-end">
                    <button
                      type="button"
                      disabled={!u.role || busyId === u.id}
                      onClick={() => void handleApprove(u.id)}
                      title="Setujui & aktifkan"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => focusRoleSelect(u.id)}
                      title="Pilih role"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition-colors duration-200 hover:bg-amber-700 active:scale-95"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => void handleReject(u.id)}
                      title="Tolak"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-[#e7ebf6] p-6">
            <div>
              <h2 className="text-lg font-bold text-blue-950">Daftar Pengguna Terdaftar (Aktif)</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Daftar akun PTDI yang terdaftar pada SIGMA eSPI dengan hak akses aktif. Gunakan switch untuk mengubah
                status keaktifan
              </p>
            </div>

            <div className="mt-5 hidden grid-cols-[1.3fr_1.6fr_1fr_0.9fr_0.8fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
              <span>User (Avatar &amp; Nama)</span>
              <span>Email &amp; No HP</span>
              <span>Unit Kerja</span>
              <span>Role</span>
              <span>Status</span>
              <span>Toggle Keaktifan</span>
              <span className="text-right">Aksi</span>
            </div>

            <div className="mt-3 space-y-3">
              {!isLoading && filteredActive.length === 0 && (
                <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
                  Tidak ada pengguna yang cocok.
                </div>
              )}
              {filteredActive.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-2 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1.3fr_1.6fr_1fr_0.9fr_0.8fr_0.8fr_auto]"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle2 size={32} className="shrink-0 text-slate-300" />
                    <div>
                      <div className="font-semibold text-slate-800">{u.nama}</div>
                      <div className="text-xs text-slate-400">
                        {u.nip} - {u.role}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-700">{u.email}</div>
                    <div className="text-xs text-slate-400">{u.noHp}</div>
                  </div>
                  <div>
                    {editingRoleId === u.id ? (
                      <select
                        value={draftUnit}
                        onChange={(e) => setDraftUnit(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {availableUnits.map((unitName) => (
                          <option key={unitName} value={unitName}>
                            {unitName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-500">{u.unitKerja}</span>
                    )}
                  </div>
                  <div>
                    {editingRoleId === u.id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          autoFocus
                          value={draftRole}
                          onChange={(e) => setDraftRole(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {availableRoleNames().map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => void confirmEditRole(u.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRoleId(null)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex w-fit rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                        {u.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${u.aktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={u.aktif ? 'text-emerald-600' : 'text-slate-400'}>
                      {u.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <Switch checked={u.aktif} onChange={() => void handleToggle(u.id)} label={`Status aktif ${u.nama}`} />
                  <div className="flex gap-2 sm:justify-self-end">
                    <button
                      type="button"
                      onClick={() => startEditRole(u.id, u.role, u.unitKerja)}
                      title="Ubah role"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition-colors duration-200 hover:bg-amber-700 active:scale-95"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => void handleDelete(u.id, u.nama)}
                      title="Hapus akun"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
