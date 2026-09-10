import { useEffect, useState } from 'react'
import { Building2, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminShell } from '../../components/admin/AdminShell'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { UnitItem } from '../../services/adminUnitService'
import { createUnit, deleteUnit, getUnitsForManagement, updateUnit } from '../../services/adminUnitService'

/**
 * Poin review klien #4: Admin belum bisa kelola master data Unit Kerja.
 * Halaman ini menyediakan CRUD sederhana (tambah, ubah nama, hapus) untuk
 * daftar Unit Kerja yang dipakai di seluruh sistem (dropdown Unit Kerja di
 * Kelola User, dsb).
 */
export function AdminUnitsPage() {
  const [units, setUnits] = useState<UnitItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newUnitName, setNewUnitName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    void loadUnits()
  }, [])

  async function loadUnits() {
    setIsLoading(true)
    try {
      const data = await getUnitsForManagement()
      setUnits(data)
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal memuat daftar unit kerja.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    const nama = newUnitName.trim()
    if (!nama) return
    setIsCreating(true)
    try {
      const created = await createUnit(nama)
      setUnits((prev) => [...prev, created].sort((a, b) => a.namaUnit.localeCompare(b.namaUnit)))
      setNewUnitName('')
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal menambah unit kerja.'))
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(unit: UnitItem) {
    setEditingId(unit.id)
    setDraftName(unit.namaUnit)
  }

  async function confirmEdit(id: number) {
    const nama = draftName.trim()
    if (!nama) return
    setBusyId(id)
    try {
      const updated = await updateUnit(id, nama)
      setUnits((prev) =>
        prev.map((u) => (u.id === id ? updated : u)).sort((a, b) => a.namaUnit.localeCompare(b.namaUnit)),
      )
      setEditingId(null)
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal mengubah nama unit kerja.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: number, namaUnit: string) {
    if (!window.confirm(`Hapus unit kerja "${namaUnit}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setBusyId(id)
    try {
      await deleteUnit(id)
      setUnits((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Unit kerja tidak dapat dihapus karena masih dipakai data lain.'))
    } finally {
      setBusyId(null)
    }
  }

  const filteredUnits = units.filter((u) => u.namaUnit.toLowerCase().includes(searchQuery.trim().toLowerCase()))

  return (
    <AdminShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari unit kerja">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Kelola Unit Kerja</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola daftar master data unit kerja yang dipakai di seluruh sistem SIGMA eSPI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Unit Kerja" value={units.length} icon={Building2} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Tambah Unit Kerja Baru</h2>
        <p className="mt-0.5 text-sm text-slate-500">Nama unit kerja akan langsung tersedia di dropdown Unit Kerja.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleCreate()
          }}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="mis. Divisi Produksi Aerostructure"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={isCreating || !newUnitName.trim()}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
            Tambah Unit
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Daftar Unit Kerja</h2>
        <p className="mt-0.5 text-sm text-slate-500">Total {units.length} unit kerja terdaftar.</p>

        <div className="mt-5 hidden grid-cols-[1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nama Unit Kerja</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredUnits.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada unit kerja yang cocok.
            </div>
          )}
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
            >
              {editingId === unit.id ? (
                <input
                  autoFocus
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <span className="truncate font-semibold text-slate-800">{unit.namaUnit}</span>
              )}

              <div className="flex gap-2 justify-self-end">
                {editingId === unit.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === unit.id}
                      onClick={() => void confirmEdit(unit.id)}
                      title="Simpan"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      title="Batal"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(unit)}
                      title="Ubah nama"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition-colors duration-200 hover:bg-amber-700 active:scale-95"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === unit.id}
                      onClick={() => void handleDelete(unit.id, unit.namaUnit)}
                      title="Hapus unit kerja"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}
