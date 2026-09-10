import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Info, MessageSquare, Star, UploadCloud } from 'lucide-react'
import { AuditeeShell } from '../../components/auditee/AuditeeShell'
import { StatCard } from '../../components/ui/StatCard'

type NotifTipe = 'info' | 'warning' | 'success'

interface Notifikasi {
  id: number
  judul: string
  waktu: string
  tipe: NotifTipe
  dibaca: boolean
}

// Data contoh (statis) mengikuti mockup UI/UX -- modul Auditee sisi
// backend belum dibangun. Klik notifikasi menandainya sebagai sudah
// dibaca melalui state lokal.
const NOTIF_AWAL: Notifikasi[] = [
  { id: 1, judul: 'Temuan baru TM/041/003 telah diekspos, mohon tanggapan Anda.', waktu: '2 jam lalu', tipe: 'warning', dibaca: false },
  { id: 2, judul: 'Rencana aksi untuk TM/041/001 sedang diverifikasi Ketua Tim.', waktu: 'Kemarin', tipe: 'info', dibaca: false },
  { id: 3, judul: 'LHA/041/001 telah diterbitkan dan dapat diunduh.', waktu: '3 hari lalu', tipe: 'success', dibaca: true },
  { id: 4, judul: 'Survei kepuasan audit untuk penugasan STA/041/007 sudah dapat diisi.', waktu: '5 hari lalu', tipe: 'info', dibaca: true },
]

const NOTIF_ICON: Record<NotifTipe, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
}

const NOTIF_STYLE: Record<NotifTipe, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
}

export function AuditeeBerandaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifList, setNotifList] = useState<Notifikasi[]>(NOTIF_AWAL)

  const filteredNotif = notifList.filter((n) => n.judul.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  const belumDibaca = notifList.filter((n) => !n.dibaca).length

  function tandaiDibaca(id: number) {
    setNotifList((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)))
  }

  return (
    <AuditeeShell searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari notifikasi">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">Beranda Auditee</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan aktivitas audit yang melibatkan unit Anda dan notifikasi terbaru.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Temuan Menunggu Tanggapan" value={1} icon={MessageSquare} badge="Perlu Tindakan" />
        <StatCard label="Rencana Aksi Berjalan" value={2} icon={UploadCloud} />
        <StatCard label="Survei Belum Diisi" value={1} icon={Star} />
      </div>

      <section className="rounded-2xl bg-[#e7ebf6] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-950">Notifikasi</h2>
            <p className="mt-0.5 text-sm text-slate-500">Klik notifikasi untuk menandainya sebagai sudah dibaca.</p>
          </div>
          {belumDibaca > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-white">
              <ClipboardList size={13} />
              {belumDibaca} belum dibaca
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {filteredNotif.length === 0 && (
            <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
              Tidak ada notifikasi yang cocok.
            </div>
          )}
          {filteredNotif.map((n) => {
            const Icon = NOTIF_ICON[n.tipe]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => tandaiDibaca(n.id)}
                className={`flex w-full items-start gap-3 rounded-2xl bg-white px-5 py-4 text-left shadow-sm transition-opacity ${n.dibaca ? 'opacity-60' : ''}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${NOTIF_STYLE[n.tipe]}`}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{n.judul}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{n.waktu}</span>
                </span>
                {!n.dibaca && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
              </button>
            )
          })}
        </div>
      </section>
    </AuditeeShell>
  )
}
