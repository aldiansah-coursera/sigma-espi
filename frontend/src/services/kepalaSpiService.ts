import { api } from '../lib/api'

export const PRIORITAS_RISIKO_OPTIONS = ['Tinggi', 'Sedang', 'Rendah']

export interface Pkpt {
  pkptId: number
  tahunAnggaran: number
  namaPkpt: string
  tanggalMulai: string
  tanggalSelesai: string
  status: string
  dibuatOleh: string
  totalObjek: number
}

export interface ObjekPengawasanInput {
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
}

export interface CreatePkptPayload {
  tahunAnggaran: number
  namaPkpt: string
  tanggalMulai: string
  tanggalSelesai: string
  objekPengawasan: ObjekPengawasanInput[]
}

export interface ObjekPengawasanOption {
  objekId: number
  namaPkpt: string
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
  status: string
}

export interface Sta {
  penugasanId: number
  nomorSta: string
  tanggalTerbit: string
  objekAudit: string
  unitKerja: string
  periode: string
  ketuaTim: string
  diterbitkanOleh: string
  statusApproval: string
}

export interface UserOption {
  id: number
  nama: string
}

export interface Lha {
  lhaId: number
  penugasanId: number
  nomorLha: string
  nomorSta: string
  objekAudit: string
  ketuaTim: string
  anggotaTimCount: number
  status: string
  statusQa: string
  tanggalTerbit: string
  disetujuiOleh: string
  fileUrl: string | null
}

export interface LhaSummary {
  menungguOtorisasi: number
  lhaDiterbitkanTahunIni: number
  criticalHighFindings: number
}

// ---- PKPT ----

export async function getUnits(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/kepala-spi/units')
  return data
}

export async function getPkptList(): Promise<Pkpt[]> {
  const { data } = await api.get<Pkpt[]>('/api/kepala-spi/pkpt')
  return data
}

export async function createPkpt(payload: CreatePkptPayload): Promise<void> {
  await api.post('/api/kepala-spi/pkpt', payload)
}

export async function approvePkpt(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/pkpt/${id}/approve`)
}

export async function rejectPkpt(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/pkpt/${id}/reject`)
}

// ---- STA ----

export async function getStaList(): Promise<Sta[]> {
  const { data } = await api.get<Sta[]>('/api/kepala-spi/sta')
  return data
}

export async function getObjekOptions(): Promise<ObjekPengawasanOption[]> {
  const { data } = await api.get<ObjekPengawasanOption[]>('/api/kepala-spi/sta/objek-options')
  return data
}

export async function getKetuaTimOptions(): Promise<UserOption[]> {
  const { data } = await api.get<UserOption[]>('/api/kepala-spi/sta/ketua-tim-options')
  return data
}

export async function createSta(objekId: number, ketuaTimUserId: number): Promise<void> {
  await api.post('/api/kepala-spi/sta', { objekId, ketuaTimUserId })
}

// ---- LHA ----

export async function getLhaList(): Promise<Lha[]> {
  const { data } = await api.get<Lha[]>('/api/kepala-spi/lha')
  return data
}

export async function getLhaSummary(): Promise<LhaSummary> {
  const { data } = await api.get<LhaSummary>('/api/kepala-spi/lha/summary')
  return data
}

export async function authorizeLha(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/lha/${id}/authorize`)
}
