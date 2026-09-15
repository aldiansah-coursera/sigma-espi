import { api } from '../lib/api'

// Tahap 04 flowmap v3.0 -- Administrator mengelola Profil & Kompetensi
// Auditor (bidang keahlian & sertifikasi tiap auditor).
export interface KompetensiItem {
  kompetensiId: number
  userId: number | null
  namaAuditor: string | null
  roleAuditor: string | null
  unitKerja: string | null
  bidangKeahlian: string | null
  sertifikasi: string | null
  tanggalDiperoleh: string | null
  status: string | null
}

export interface KompetensiPayload {
  userId: number
  bidangKeahlian: string
  sertifikasi?: string
  tanggalDiperoleh?: string
  status?: string
}

export interface AuditorOption {
  id: number
  nama: string
}

export async function getKompetensiList(): Promise<KompetensiItem[]> {
  const { data } = await api.get<KompetensiItem[]>('/api/admin/kompetensi')
  return data
}

export async function getAuditorOptions(): Promise<AuditorOption[]> {
  const { data } = await api.get<AuditorOption[]>('/api/admin/kompetensi/auditor-options')
  return data
}

export async function getStatusOptions(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/admin/kompetensi/status-options')
  return data
}

export async function createKompetensi(payload: KompetensiPayload): Promise<KompetensiItem> {
  const { data } = await api.post<KompetensiItem>('/api/admin/kompetensi', payload)
  return data
}

export async function updateKompetensi(id: number, payload: KompetensiPayload): Promise<KompetensiItem> {
  const { data } = await api.put<KompetensiItem>(`/api/admin/kompetensi/${id}`, payload)
  return data
}

export async function deleteKompetensi(id: number): Promise<void> {
  await api.delete(`/api/admin/kompetensi/${id}`)
}
