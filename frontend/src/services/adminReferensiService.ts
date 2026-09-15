import { api } from '../lib/api'

// Tahap 03 flowmap v3.0 -- Administrator mengelola Parameter Risiko,
// Data Referensi & Regulasi (satu tabel, dibedakan kolom kategori).
export interface ReferensiItem {
  refId: number
  kategori: string
  kode: string
  nilai: string
  dikelolaOleh: string | null
}

export interface ReferensiPayload {
  kategori: string
  kode: string
  nilai: string
}

export async function getReferensiList(): Promise<ReferensiItem[]> {
  const { data } = await api.get<ReferensiItem[]>('/api/admin/referensi')
  return data
}

export async function getKategoriOptions(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/admin/referensi/kategori-options')
  return data
}

export async function createReferensi(payload: ReferensiPayload): Promise<ReferensiItem> {
  const { data } = await api.post<ReferensiItem>('/api/admin/referensi', payload)
  return data
}

export async function updateReferensi(id: number, payload: ReferensiPayload): Promise<ReferensiItem> {
  const { data } = await api.put<ReferensiItem>(`/api/admin/referensi/${id}`, payload)
  return data
}

export async function deleteReferensi(id: number): Promise<void> {
  await api.delete(`/api/admin/referensi/${id}`)
}
