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
