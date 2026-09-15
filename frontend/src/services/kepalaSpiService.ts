import { api } from '../lib/api'

// PKPT sekarang disusun Dukungan Audit (lihat dukunganAuditService.ts);
// Kepala SPI hanya memeriksa (check), mengesahkan (approve), atau
// mengembalikan dengan catatan revisi -- alur SIGMA v3.0 tahap 05-06.
export interface PkptObjekRingkas {
  objekId: number
  unitKerja: string
  jenisPengawasan: string
  prioritasRisiko: string
  status: string
}

export interface Pkpt {
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
  totalObjek: number
  objekPengawasan: PkptObjekRingkas[]
}

export interface Sta {
  penugasanId: number
  nomorSta: string
  tanggalTerbit: string
  tanggalMulai: string
  tanggalSelesai: string
  ruangLingkup: string
  targetAudit: string
  objekAudit: string
  unitKerja: string
  periode: string
  ketuaTim: string
  diterbitkanOleh: string | null
  statusApproval: string
  pppId: number | null
  dibuatOleh: string | null
  didistribusikanOleh: string | null
  tanggalDistribusi: string | null
  catatanRevisi: string | null
  komposisiTim: string | null
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

export async function getPkptList(): Promise<Pkpt[]> {
  const { data } = await api.get<Pkpt[]>('/api/kepala-spi/pkpt')
  return data
}

export async function checkPkpt(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/pkpt/${id}/check`)
}

export async function approvePkpt(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/pkpt/${id}/approve`)
}

export async function kembalikanPkpt(id: number, catatan: string): Promise<void> {
  await api.post(`/api/kepala-spi/pkpt/${id}/kembalikan`, { catatan })
}

// ---- STA ----

export async function getStaList(): Promise<Sta[]> {
  const { data } = await api.get<Sta[]>('/api/kepala-spi/sta')
  return data
}

export async function tandaTanganSta(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/sta/${id}/tanda-tangan`)
}

export async function kembalikanSta(id: number, catatan: string): Promise<void> {
  await api.post(`/api/kepala-spi/sta/${id}/kembalikan`, { catatan })
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

// ---- Dokumen Program (DOK PROG) ----
// Draf disusun Dukungan Audit (lihat dukunganAuditService.ts); di sini
// Kepala SPI memeriksa (Checked) lalu menyetujui (Approved), atau
// mengembalikan draf yang belum sesuai ke status Draft.

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

export async function getDokumenProgramList(): Promise<DokumenProgram[]> {
  const { data } = await api.get<DokumenProgram[]>('/api/kepala-spi/dokumen')
  return data
}

export async function checkDokumen(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/dokumen/${id}/check`)
}

export async function approveDokumen(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/dokumen/${id}/approve`)
}

export async function kembalikanDokumen(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/dokumen/${id}/kembalikan`)
}

// ---- PPP: Program & Pengajuan Penugasan (tahap 07 flowmap v3.0) ----
// Diusulkan Ketua Tim, diteruskan Pengawas, disetujui Kepala SPI di sini.

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

export async function getPppList(): Promise<Ppp[]> {
  const { data } = await api.get<Ppp[]>('/api/kepala-spi/ppp')
  return data
}

export async function approvePpp(id: number): Promise<void> {
  await api.post(`/api/kepala-spi/ppp/${id}/approve`)
}

export async function kembalikanPpp(id: number, catatan: string): Promise<void> {
  await api.post(`/api/kepala-spi/ppp/${id}/kembalikan`, { catatan })
}
