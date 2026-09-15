import { api } from '../lib/api'

export interface Pka {
  pkaId: number
  penugasanId: number
  nomorSta: string
  objekAudit: string
  langkahKerja: string
  alokasiWaktu: string
  statusPersetujuan: string
  disetujuiOleh: string | null
}

export interface PenugasanOption {
  penugasanId: number
  nomorSta: string
  objekAudit: string
}

export interface CreatePkaPayload {
  penugasanId: number
  langkahKerja: string
  alokasiWaktu: string
}

export interface UpdatePkaPayload {
  langkahKerja: string
  alokasiWaktu: string
}

export async function getPkaList(): Promise<Pka[]> {
  const { data } = await api.get<Pka[]>('/api/ketua-tim/pka')
  return data
}

export async function getPenugasanOptions(): Promise<PenugasanOption[]> {
  const { data } = await api.get<PenugasanOption[]>('/api/ketua-tim/pka/penugasan-options')
  return data
}

export async function createPka(payload: CreatePkaPayload): Promise<void> {
  await api.post('/api/ketua-tim/pka', payload)
}

export async function updatePka(pkaId: number, payload: UpdatePkaPayload): Promise<void> {
  await api.put(`/api/ketua-tim/pka/${pkaId}`, payload)
}

// ---- PPP: Program & Pengajuan Penugasan (tahap 06 flowmap v3.0) ----
// Ketua Tim MENGUSULKAN, Pengawas menyetujui & meneruskan, Kepala SPI
// menyetujui. Status: Draft -> Diajukan -> Diteruskan -> Disetujui.

export interface Ppp {
  pppId: number
  objekId: number | null
  namaPkpt: string | null
  unitKerja: string | null
  jenisPengawasan: string | null
  prioritasRisiko: string | null
  ruangLingkup: string | null
  sasaranAudit: string | null
  komposisiTim: string | null
  tanggalMulai: string | null
  tanggalSelesai: string | null
  status: string
  diusulkanOleh: string | null
  disetujuiPengawas: string | null
  disetujuiKepalaSpi: string | null
  catatanRevisi: string | null
  createdAt: string | null
}

export interface PppObjekOption {
  objekId: number
  namaPkpt: string
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
  status: string
}

export interface PppPayload {
  objekId: number
  ruangLingkup: string
  sasaranAudit: string
  komposisiTim?: string
  tanggalMulai: string
  tanggalSelesai: string
}

export async function getPppList(): Promise<Ppp[]> {
  const { data } = await api.get<Ppp[]>('/api/ketua-tim/ppp')
  return data
}

export async function getPppObjekOptions(): Promise<PppObjekOption[]> {
  const { data } = await api.get<PppObjekOption[]>('/api/ketua-tim/ppp/objek-options')
  return data
}

export async function createPpp(payload: PppPayload): Promise<void> {
  await api.post('/api/ketua-tim/ppp', payload)
}

export async function updatePpp(id: number, payload: PppPayload): Promise<void> {
  await api.put(`/api/ketua-tim/ppp/${id}`, payload)
}

export async function ajukanPpp(id: number): Promise<void> {
  await api.post(`/api/ketua-tim/ppp/${id}/ajukan`)
}

export async function hapusPppDraft(id: number): Promise<void> {
  await api.delete(`/api/ketua-tim/ppp/${id}`)
}
