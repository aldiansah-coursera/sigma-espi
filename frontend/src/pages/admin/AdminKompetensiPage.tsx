import { useEffect, useMemo, useState } from 'react'
import { Award, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminShell } from '../../components/admin/AdminShell'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { AuditorOption, KompetensiItem, KompetensiPayload } from '../../services/adminKompetensiService'
import {
  createKompetensi,
  deleteKompetensi,
  getAuditorOptions,
  getKompetensiList,
  getStatusOptions,
  updateKompetensi,
} from '../../services/adminKompetensiService'

const STATUS_STYLES: Record<string, string> = {
  Aktif: 'bg-emerald-100 text-emerald-700',
  Kedaluwarsa: 'bg-rose-100 text-rose-700',
  'Dalam Proses': 'bg-amber-100 text-amber-700',
}

function statusBadgeClass(status: string | null): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
}

function emptyDraft(): KompetensiPayload {
  return { userId: 0, bidangKeahlian: '', sertifikasi: '', tanggalDiperoleh: '', status: 'Aktif' }
}

/**
 * Tahap 04 flowmap SIGMA v3.0 -- Administrator "Mengelola Profil &
 * Kompetensi Auditor": bidang keahlian & sertifikasi tiap auditor, jadi
 * bahan pertimbangan saat menyusun komposisi tim pada PPP.
 */
export function AdminKompetensiPage() {
  const [items, setItems] = useState<KompetensiItem[]>([])
  const [auditorOptions, setAuditorOptions] = useState<AuditorOption[]>([])
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState<KompetensiPayload>(emptyDraft())
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<KompetensiPayload>(emptyDraft())
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([getKompetensiList(), getAuditorOptions(), getStatusOptions()])
      .then(([list, auditors, statuses]) => {
        if (cancelled) return
        setItems(list)
        setAuditorOptions(auditors)
        setStatusOptions(statuses)
        setForm((prev) => ({ ...prev, userId: prev.userId || auditors[0]?.id || 0 }))
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setIsLoading(false)
        window.alert(extractErrorMessage(err, 'Gagal memuat profil kompetensi auditor.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate() {
    if (!form.userId || !form.bidangKeahlian.trim()) return
    setIsCreating(true)
    try {
      const created = await createKompetensi({
        userId: form.userId,
        bidangKeahlian: form.bidangKeahlian.trim(),
        sertifikasi: form.sertifikasi?.trim() || undefined,
        tanggalDiperoleh: form.tanggalDiperoleh || undefined,
        status: form.status,
      })
      setItems((prev) => [...prev, created])
      setForm({ ...emptyDraft(), userId: form.userId })
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal menambah profil kompetensi.'))
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(item: KompetensiItem) {
    setEditingId(item.kompetensiId)
    setDraft({
      userId: item.userId ?? 0,
      bidangKeahlian: item.bidangKeahlian ?? '',
      sertifikasi: item.sertifikasi ?? '',
      tanggalDiperoleh: item.tanggalDiperoleh ?? '',
      status: item.status ?? 'Aktif',
    })
  }

  async function confirmEdit(id: number) {
    if (!draft.userId || !draft.bidangKeahlian.trim()) return
    setBusyId(id)
    try {
      const updated = await updateKompetensi(id, {
        userId: draft.userId,
        bidangKeahlian: draft.bidangKeahlian.trim(),
        sertifikasi: draft.sertifikasi?.trim() || undefined,
        tanggalDiperoleh: draft.tanggalDiperoleh || undefined,
        status: draft.status,
      })
      setItems((prev) => prev.map((i) => (i.kompetensiId === id ? updated : i)))
      setEditingId(null)
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal mengubah profil kompetensi.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item: KompetensiItem) {
    if (!window.confirm(`Hapus profil kompetensi "${item.bidangKeahlian}" milik ${item.namaAuditor}?`)) return
    setBusyId(item.kompetensiId)
    try {
      await deleteKompetensi(item.kompetensiId)
      setItems((prev) => prev.filter((i) => i.kompetensiId !== item.kompetensiId))
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Profil kompetensi tidak dapat dihapus.'))
    } finally {
      setBusyId(null)
    }
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        (i.namaAuditor ?? '').toLowerCase().includes(q) ||
        (i.bidangKeahlian ?? '').toLowerCase().includes(q) ||
        (i.sertifikasi ?? '').toLowerCase().includes(q),
    )
  }, [items, searchQuery])

  const auditorTercatat = new Set(items.map((i) => i.userId)).size
  const sertifikasiAktif = items.filter((i) => i.status === 'Aktif').length

  return (
    <AdminShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari auditor atau keahlian">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Profil &amp; Kompetensi Auditor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catat bidang keahlian dan sertifikasi tiap auditor sebagai dasar penyusunan komposisi tim penugasan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Profil Kompetensi" value={items.length} icon={Award} />
        <StatCard label="Auditor Tercatat" value={auditorTercatat} />
        <StatCard label="Sertifikasi Aktif" value={sertifikasiAktif} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Tambah Profil Kompetensi</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Hanya user dengan role Auditor atau Ketua Tim yang bisa dipilih di sini.
        </p>

        {auditorOptions.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
            Belum ada user dengan role Auditor atau Ketua Tim. Tambahkan lewat menu Kelola User &amp; Role dulu.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
            className="mt-4 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Auditor</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((p) => ({ ...p, userId: Number(e.target.value) }))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {auditorOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Bidang Keahlian</label>
                <input
                  type="text"
                  value={form.bidangKeahlian}
                  onChange={(e) => setForm((p) => ({ ...p, bidangKeahlian: e.target.value }))}
                  placeholder="mis. Audit Pengadaan &amp; Rantai Pasok"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Sertifikasi</label>
                <input
                  type="text"
                  value={form.sertifikasi}
                  onChange={(e) => setForm((p) => ({ ...p, sertifikasi: e.target.value }))}
                  placeholder="mis. QIA, CIA"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Tanggal Diperoleh</label>
                <input
                  type="date"
                  value={form.tanggalDiperoleh}
                  onChange={(e) => setForm((p) => ({ ...p, tanggalDiperoleh: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating || !form.bidangKeahlian.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
                Tambah Profil
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Daftar Profil Kompetensi</h2>
        <p className="mt-0.5 text-sm text-slate-500">Total {items.length} profil kompetensi tercatat.</p>

        <div className="mt-5 hidden grid-cols-[1fr_1.2fr_0.9fr_0.7fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Auditor</span>
          <span>Bidang Keahlian</span>
          <span>Sertifikasi</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredItems.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada profil kompetensi yang cocok.
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.kompetensiId}
              className="grid min-w-0 grid-cols-1 items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[1fr_1.2fr_0.9fr_0.7fr_auto] sm:gap-4"
            >
              {editingId === item.kompetensiId ? (
                <>
                  <select
                    value={draft.userId}
                    onChange={(e) => setDraft((p) => ({ ...p, userId: Number(e.target.value) }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {auditorOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={draft.bidangKeahlian}
                    onChange={(e) => setDraft((p) => ({ ...p, bidangKeahlian: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={draft.sertifikasi}
                    onChange={(e) => setDraft((p) => ({ ...p, sertifikasi: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">{item.namaAuditor ?? '-'}</div>
                    <div className="truncate text-xs text-slate-400">
                      {item.roleAuditor ?? '-'} &middot; {item.unitKerja ?? '-'}
                    </div>
                  </div>
                  <span className="truncate text-slate-700">{item.bidangKeahlian ?? '-'}</span>
                  <div className="min-w-0">
                    <div className="truncate text-slate-600">{item.sertifikasi || '-'}</div>
                    <div className="truncate text-xs text-slate-400">{item.tanggalDiperoleh ?? ''}</div>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                  >
                    {item.status ?? '-'}
                  </span>
                </>
              )}

              <div className="flex gap-2 justify-self-end">
                {editingId === item.kompetensiId ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === item.kompetensiId}
                      onClick={() => void confirmEdit(item.kompetensiId)}
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
                      onClick={() => startEdit(item)}
                      title="Ubah"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition-colors duration-200 hover:bg-amber-700 active:scale-95"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.kompetensiId}
                      onClick={() => void handleDelete(item)}
                      title="Hapus"
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
