import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, Plus, ShieldAlert, Trash2, X } from 'lucide-react'
import { AdminShell } from '../../components/admin/AdminShell'
import { StatCard } from '../../components/ui/StatCard'
import { extractErrorMessage } from '../../lib/api'
import type { ReferensiItem, ReferensiPayload } from '../../services/adminReferensiService'
import {
  createReferensi,
  deleteReferensi,
  getKategoriOptions,
  getReferensiList,
  updateReferensi,
} from '../../services/adminReferensiService'

/**
 * Tahap 03 flowmap SIGMA v3.0 -- Administrator "Mengelola Parameter Risiko,
 * Referensi & Regulasi". Ketiganya disimpan di satu tabel data_referensi dan
 * dibedakan lewat kategori, jadi halaman ini satu tabel dengan filter
 * kategori di atasnya.
 */
export function AdminReferensiPage() {
  const [items, setItems] = useState<ReferensiItem[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')

  const [formKategori, setFormKategori] = useState('')
  const [formKode, setFormKode] = useState('')
  const [formNilai, setFormNilai] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ReferensiPayload>({ kategori: '', kode: '', nilai: '' })
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([getReferensiList(), getKategoriOptions()])
      .then(([list, kategori]) => {
        if (cancelled) return
        setItems(list)
        setKategoriOptions(kategori)
        setFormKategori((prev) => prev || kategori[0] || '')
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setIsLoading(false)
        window.alert(extractErrorMessage(err, 'Gagal memuat data referensi.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate() {
    if (!formKategori || !formKode.trim() || !formNilai.trim()) return
    setIsCreating(true)
    try {
      const created = await createReferensi({
        kategori: formKategori,
        kode: formKode.trim(),
        nilai: formNilai.trim(),
      })
      setItems((prev) => [...prev, created])
      setFormKode('')
      setFormNilai('')
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal menambah data referensi.'))
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(item: ReferensiItem) {
    setEditingId(item.refId)
    setDraft({ kategori: item.kategori, kode: item.kode, nilai: item.nilai })
  }

  async function confirmEdit(id: number) {
    if (!draft.kategori || !draft.kode.trim() || !draft.nilai.trim()) return
    setBusyId(id)
    try {
      const updated = await updateReferensi(id, {
        kategori: draft.kategori,
        kode: draft.kode.trim(),
        nilai: draft.nilai.trim(),
      })
      setItems((prev) => prev.map((i) => (i.refId === id ? updated : i)))
      setEditingId(null)
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Gagal mengubah data referensi.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item: ReferensiItem) {
    if (!window.confirm(`Hapus "${item.kode} - ${item.nilai}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setBusyId(item.refId)
    try {
      await deleteReferensi(item.refId)
      setItems((prev) => prev.filter((i) => i.refId !== item.refId))
    } catch (err) {
      window.alert(extractErrorMessage(err, 'Data referensi tidak dapat dihapus.'))
    } finally {
      setBusyId(null)
    }
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items.filter((i) => {
      const cocokKategori = filterKategori === 'Semua' || i.kategori === filterKategori
      const cocokQuery = !q || i.kode.toLowerCase().includes(q) || i.nilai.toLowerCase().includes(q)
      return cocokKategori && cocokQuery
    })
  }, [items, filterKategori, searchQuery])

  const parameterRisikoCount = items.filter((i) => i.kategori === 'Parameter Risiko').length
  const regulasiCount = items.filter((i) => i.kategori === 'Regulasi').length

  return (
    <AdminShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari kode atau nilai">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Parameter Risiko, Referensi &amp; Regulasi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Master data acuan yang dipakai di seluruh siklus audit: parameter penilaian risiko, data referensi, dan
          daftar regulasi yang berlaku.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Data Acuan" value={items.length} icon={ShieldAlert} />
        <StatCard label="Parameter Risiko" value={parameterRisikoCount} />
        <StatCard label="Regulasi" value={regulasiCount} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <h2 className="text-lg font-bold text-blue-950">Tambah Data Acuan</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Contoh: kategori Parameter Risiko, kode &quot;RISK-TINGGI&quot;, nilai &quot;Skor 8-10&quot;.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleCreate()
          }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[0.9fr_0.8fr_1.3fr_auto]"
        >
          <select
            value={formKategori}
            onChange={(e) => setFormKategori(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {kategoriOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formKode}
            onChange={(e) => setFormKode(e.target.value)}
            placeholder="Kode"
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="text"
            value={formNilai}
            onChange={(e) => setFormNilai(e.target.value)}
            placeholder="Nilai / keterangan"
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={isCreating || !formKode.trim() || !formNilai.trim()}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
            Tambah
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-blue-950">Daftar Data Acuan</h2>
            <p className="mt-0.5 text-sm text-slate-500">Total {items.length} data acuan terdaftar.</p>
          </div>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="Semua">Semua kategori</option>
            {kategoriOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 hidden grid-cols-[0.9fr_0.8fr_1.3fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Kategori</span>
          <span>Kode</span>
          <span>Nilai / Keterangan</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredItems.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada data acuan yang cocok.
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.refId}
              className="grid min-w-0 grid-cols-1 items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm sm:grid-cols-[0.9fr_0.8fr_1.3fr_auto] sm:gap-4"
            >
              {editingId === item.refId ? (
                <>
                  <select
                    value={draft.kategori}
                    onChange={(e) => setDraft((p) => ({ ...p, kategori: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {kategoriOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={draft.kode}
                    onChange={(e) => setDraft((p) => ({ ...p, kode: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={draft.nilai}
                    onChange={(e) => setDraft((p) => ({ ...p, nilai: e.target.value }))}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </>
              ) : (
                <>
                  <span className="truncate text-sm font-semibold text-blue-800">{item.kategori}</span>
                  <span className="truncate font-semibold text-slate-800">{item.kode}</span>
                  <span className="truncate text-slate-600">{item.nilai}</span>
                </>
              )}

              <div className="flex gap-2 justify-self-end">
                {editingId === item.refId ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === item.refId}
                      onClick={() => void confirmEdit(item.refId)}
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
                      disabled={busyId === item.refId}
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
