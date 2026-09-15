import { api } from '../lib/api'

// Status DOK PROG: Draft (dibuat Dukungan Audit) -> Checked -> Approved
// (dua tahap terakhir oleh Kepala SPI, lihat kepalaSpiService.ts).
export interface DokumenProgram {
  regulasiId: number
  judul: string
  kategori: string
  fileUrl: string | null
  status: string
  dibuatOleh: string | null
  direviewOleh: string | null
  createdAt: string | null
}

export interface CreateDokumenProgramPayload {
  judul: string
  kategori: string
  fileUrl?: string
}

export async function getDokumenList(): Promise<DokumenProgram[]> {
  const { data } = await api.get<DokumenProgram[]>('/api/dukungan-audit/dokumen')
  return data
}

export async function createDokumen(payload: CreateDokumenProgramPayload): Promise<void> {
  await api.post('/api/dukungan-audit/dokumen', payload)
}

// Hanya bisa dipanggil user dengan role "Dukungan Audit" (koordinator) --
// backend menolak dengan 403 kalau dipanggil oleh "Dukungan Audit Staff".
export async function ajukanDokumen(id: number): Promise<void> {
  await api.post(`/api/dukungan-audit/dokumen/${id}/ajukan`)
}

// ---- Data PKPT (tahap 05 flowmap v3.0) ----
// Dukungan Audit menyusun draf & menerbitkan; Kepala SPI memeriksa
// (Checked) lalu mengesahkan (Approved).
// Status: Draft -> Diajukan -> Checked -> Approved -> Diterbitkan.

export const PRIORITAS_RISIKO_OPTIONS = ['Tinggi', 'Sedang', 'Rendah']

export interface PkptObjekRingkas {
  objekId: number
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
  status: string
}

export interface PkptItem {
  pkptId: number
  tahunAnggaran: number
  namaPkpt: string
  tanggalMulai: string
  tanggalSelesai: string
  status: string
  dibuatOleh: string | null
  disahkanOleh: string | null
  diterbitkanOleh: string | null
  tanggalTerbit: string | null
  catatanRevisi: string | null
  fileBuktiNama: string | null
  fileBuktiUkuran: number | null
  totalObjek: number
  objekPengawasan: PkptObjekRingkas[]
}

export interface ObjekPengawasanInput {
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
}

export interface PkptPayload {
  tahunAnggaran: number
  namaPkpt: string
  tanggalMulai: string
  tanggalSelesai: string
  objekPengawasan: ObjekPengawasanInput[]
}

export async function getPkptList(): Promise<PkptItem[]> {
  const { data } = await api.get<PkptItem[]>('/api/dukungan-audit/pkpt')
  return data
}

export async function getUnitOptions(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/dukungan-audit/pkpt/unit-options')
  return data
}

export async function createPkpt(payload: PkptPayload): Promise<{ pkptId: number }> {
  const { data } = await api.post<{ pkptId: number }>('/api/dukungan-audit/pkpt', payload)
  return data
}

/** Unggah/ganti berkas PDF pendukung draf PKPT (hanya selama status Draft). */
export async function uploadPkptFile(id: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await api.post(`/api/dukungan-audit/pkpt/${id}/file`, formData, {
    headers: { 'Content-Type': undefined },
  })
}

/** Ambil berkas PDF sebagai Blob supaya bisa dibuka di tab baru (perlu header Authorization, jadi tidak bisa link biasa). */
export async function getPkptFileBlob(id: number): Promise<Blob> {
  const { data } = await api.get(`/api/dukungan-audit/pkpt/${id}/file`, { responseType: 'blob' })
  return data as Blob
}

export async function hapusPkptFile(id: number): Promise<void> {
  await api.delete(`/api/dukungan-audit/pkpt/${id}/file`)
}

export async function updatePkpt(id: number, payload: PkptPayload): Promise<void> {
  await api.put(`/api/dukungan-audit/pkpt/${id}`, payload)
}

export async function ajukanPkpt(id: number): Promise<void> {
  await api.post(`/api/dukungan-audit/pkpt/${id}/ajukan`)
}

export async function terbitkanPkpt(id: number): Promise<void> {
  await api.post(`/api/dukungan-audit/pkpt/${id}/terbitkan`)
}

export async function hapusPkptDraft(id: number): Promise<void> {
  await api.delete(`/api/dukungan-audit/pkpt/${id}`)
}

// ---- Surat Tugas / ST (tahap 08 & 10 flowmap v3.0) ----
// Dukungan Audit membuat draf ST dari PPP yang sudah disetujui, lalu
// mendistribusikannya setelah ditandatangani Kepala SPI (tahap 09).
// Status: Draft -> Diajukan -> Ditandatangani -> Didistribusikan.

export interface SuratTugas {
  penugasanId: number
  nomorSta: string
  tanggalTerbit: string | null
  tanggalMulai: string | null
  tanggalSelesai: string | null
  ruangLingkup: string | null
  targetAudit: string | null
  objekAudit: string | null
  unitKerja: string | null
  periode: string | null
  ketuaTim: string | null
  diterbitkanOleh: string | null
  statusApproval: string
  pppId: number | null
  dibuatOleh: string | null
  didistribusikanOleh: string | null
  tanggalDistribusi: string | null
  catatanRevisi: string | null
  komposisiTim: string | null
}

export interface PppOption {
  pppId: number
  namaPkpt: string | null
  unitKerja: string | null
  jenisPengawasan: string | null
  ruangLingkup: string | null
  sasaranAudit: string | null
  komposisiTim: string | null
  tanggalMulai: string | null
  tanggalSelesai: string | null
  diusulkanOleh: string | null
}

export async function getStList(): Promise<SuratTugas[]> {
  const { data } = await api.get<SuratTugas[]>('/api/dukungan-audit/st')
  return data
}

export async function getPppOptions(): Promise<PppOption[]> {
  const { data } = await api.get<PppOption[]>('/api/dukungan-audit/st/ppp-options')
  return data
}

export async function buatStDariPpp(pppId: number): Promise<void> {
  await api.post(`/api/dukungan-audit/st/dari-ppp/${pppId}`)
}

export async function ajukanSt(id: number): Promise<void> {
  await api.post(`/api/dukungan-audit/st/${id}/ajukan`)
}

export async function distribusikanSt(id: number): Promise<void> {
  await api.post(`/api/dukungan-audit/st/${id}/distribusikan`)
}

export async function hapusStDraft(id: number): Promise<void> {
  await api.delete(`/api/dukungan-audit/st/${id}`)
}
