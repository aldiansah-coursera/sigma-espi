import { useEffect, useMemo, useState } from 'react'
import { Briefcase, CheckCircle2, ChevronDown, ChevronUp, Plus, Users, X } from 'lucide-react'
import { KepalaSpiShell } from '../../components/kepala-spi/KepalaSpiShell'
import { statusBadgeClass } from '../../components/kepala-spi/statusBadge'
import { StatCard } from '../../components/ui/StatCard'
import type { ObjekPengawasanOption, Sta, UserOption } from '../../services/kepalaSpiService'
import { createSta, getKetuaTimOptions, getObjekOptions, getStaList } from '../../services/kepalaSpiService'

function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

export function PenerbitanStaPage() {
  const [staList, setStaList] = useState<Sta[]>([])
  const [objekOptions, setObjekOptions] = useState<ObjekPengawasanOption[]>([])
  const [ketuaTimOptions, setKetuaTimOptions] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [selectedObjekId, setSelectedObjekId] = useState('')
  const [selectedKetuaTimId, setSelectedKetuaTimId] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [ruangLingkup, setRuangLingkup] = useState('')
  const [targetAudit, setTargetAudit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadAll() {
    const [sta, objek, ketuaTim] = await Promise.all([getStaList(), getObjekOptions(), getKetuaTimOptions()])
    return { sta, objek, ketuaTim }
  }

  useEffect(() => {
    let cancelled = false
    loadAll().then(({ sta, objek, ketuaTim }) => {
      if (cancelled) return
      setStaList(sta)
      setObjekOptions(objek)
      setKetuaTimOptions(ketuaTim)
      setIsLoading(false)
    })
    const interval = setInterval(() => {
      void loadAll().then(({ sta, objek, ketuaTim }) => {
        if (cancelled) return
        setStaList(sta)
        setObjekOptions(objek)
        setKetuaTimOptions(ketuaTim)
      })
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filteredSta = useMemo(
    () => staList.filter((s) => matchesQuery(searchQuery, s.nomorSta, s.objekAudit, s.unitKerja, s.ketuaTim)),
    [staList, searchQuery],
  )
  const activeCount = useMemo(() => staList.filter((s) => s.statusApproval === 'Active').length, [staList])

  function openForm() {
    setFormError('')
    setSelectedObjekId('')
    setSelectedKetuaTimId('')
    setTanggalMulai('')
    setTanggalSelesai('')
    setRuangLingkup('')
    setTargetAudit('')
    setShowForm(true)
  }

  async function submitSta() {
    if (!selectedObjekId || !selectedKetuaTimId) {
      setFormError('Objek pengawasan dan ketua tim wajib dipilih.')
      return
    }
    if (!tanggalMulai || !tanggalSelesai) {
      setFormError('Jangka waktu penugasan (tanggal mulai & selesai) wajib diisi.')
      return
    }
    if (tanggalSelesai < tanggalMulai) {
      setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }
    if (!ruangLingkup.trim() || !targetAudit.trim()) {
      setFormError('Ruang lingkup dan target audit wajib diisi.')
      return
    }
    setFormError('')
    setIsSaving(true)
    try {
      await createSta({
        objekId: Number(selectedObjekId),
        ketuaTimUserId: Number(selectedKetuaTimId),
        tanggalMulai,
        tanggalSelesai,
        ruangLingkup: ruangLingkup.trim(),
        targetAudit: targetAudit.trim(),
      })
      const { sta, objek, ketuaTim } = await loadAll()
      setStaList(sta)
      setObjekOptions(objek)
      setKetuaTimOptions(ketuaTim)
      setShowForm(false)
    } catch {
      setFormError('Gagal menerbitkan STA. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <KepalaSpiShell
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Cari nomor STA atau objek audit"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Penerbitan Surat Tugas Audit (STA)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alokasikan Ketua Tim ke objek pengawasan yang telah disetujui dalam PKPT.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Batal' : 'Terbitkan STA Baru'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total STA Diterbitkan" value={staList.length} icon={Briefcase} />
        <StatCard label="Penugasan Aktif" value={activeCount} icon={CheckCircle2} />
        <StatCard label="Objek Siap Ditugaskan" value={objekOptions.length} icon={Users} subtitle="Belum punya STA" />
      </div>

      {showForm && (
        <section className="rounded-2xl bg-[#e7ebf6] p-6">
          <h2 className="text-lg font-bold text-blue-950">Terbitkan STA Baru</h2>
          <p className="mt-0.5 text-sm text-slate-500">Nomor STA akan dibuat otomatis oleh sistem setelah disimpan.</p>

          {objekOptions.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
              Belum ada objek pengawasan yang siap ditugaskan. Pastikan PKPT terkait sudah berstatus Approved dan
              belum memiliki STA.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                    Objek Pengawasan
                  </label>
                  <select
                    value={selectedObjekId}
                    onChange={(e) => setSelectedObjekId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Pilih objek pengawasan
                    </option>
                    {objekOptions.map((o) => (
                      <option key={o.objekId} value={o.objekId}>
                        {o.jenisPengawasan} &mdash; {o.unitKerja} ({o.namaPkpt})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">Ketua Tim</label>
                  <select
                    value={selectedKetuaTimId}
                    onChange={(e) => setSelectedKetuaTimId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Pilih ketua tim
                    </option>
                    {ketuaTimOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                    Tanggal Mulai Penugasan
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                    Tanggal Selesai Penugasan
                  </label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                  Ruang Lingkup (Scope)
                </label>
                <textarea
                  rows={2}
                  value={ruangLingkup}
                  onChange={(e) => setRuangLingkup(e.target.value)}
                  placeholder="mis. Audit kepatuhan proses pengadaan barang & jasa periode Januari-Juni 2026"
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                  Target / Sasaran Audit
                </label>
                <textarea
                  rows={2}
                  value={targetAudit}
                  onChange={(e) => setTargetAudit(e.target.value)}
                  placeholder="mis. Memastikan proses pengadaan sesuai SOP dan tidak ada penyimpangan anggaran"
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {formError && <p className="mt-4 text-sm font-semibold text-red-600">{formError}</p>}

          {objekOptions.length > 0 && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void submitSta()}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Menerbitkan...' : 'Terbitkan STA'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div>
          <h2 className="text-lg font-bold text-blue-950">Daftar Surat Tugas Audit</h2>
          <p className="mt-0.5 text-sm text-slate-500">Seluruh STA yang telah diterbitkan.</p>
        </div>

        <div className="mt-5 hidden grid-cols-[1fr_1.4fr_1fr_1fr_0.8fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-blue-900/50 sm:grid">
          <span>Nomor STA</span>
          <span>Objek Audit</span>
          <span>Ketua Tim</span>
          <span>Diterbitkan Oleh</span>
          <span>Tanggal</span>
          <span className="text-right">Status</span>
        </div>

        <div className="mt-3 space-y-3">
          {!isLoading && filteredSta.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Belum ada Surat Tugas Audit yang cocok.
            </div>
          )}
          {filteredSta.map((s) => {
            const isExpanded = expandedId === s.penugasanId
            return (
              <div key={s.penugasanId} className="rounded-2xl bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : s.penugasanId)}
                  className="grid w-full min-w-0 grid-cols-2 items-center gap-4 px-5 py-4 text-left sm:grid-cols-[1fr_1.4fr_1fr_1fr_0.8fr_auto]"
                >
                  <div className="truncate font-semibold text-slate-800">{s.nomorSta}</div>
                  <div className="min-w-0">
                    <div className="truncate text-slate-700">{s.objekAudit}</div>
                    <div className="truncate text-xs text-slate-400">
                      {s.unitKerja} &middot; {s.periode}
                    </div>
                  </div>
                  <div className="truncate text-slate-600">{s.ketuaTim}</div>
                  <div className="truncate text-slate-600">{s.diterbitkanOleh}</div>
                  <div className="truncate text-slate-500">{s.tanggalTerbit}</div>
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${statusBadgeClass(s.statusApproval)}`}
                    >
                      {s.statusApproval}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Jangka Waktu Penugasan
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {s.tanggalMulai || '-'} s/d {s.tanggalSelesai || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Ruang Lingkup
                      </div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.ruangLingkup || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-900/50">
                        Target / Sasaran Audit
                      </div>
                      <div className="mt-1 whitespace-pre-line text-sm text-slate-700">{s.targetAudit || '-'}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </KepalaSpiShell>
  )
}
