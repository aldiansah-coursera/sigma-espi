import { api } from '../lib/api'

// Tahap 06 flowmap v3.0 -- Pengawas (Ka. Departemen Pengawasan) menyetujui
// & meneruskan usulan PPP dari Ketua Tim ke Kepala SPI.
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
  const { data } = await api.get<Ppp[]>('/api/pengawas/ppp')
  return data
}

export async function teruskanPpp(id: number): Promise<void> {
  await api.post(`/api/pengawas/ppp/${id}/teruskan`)
}

export async function kembalikanPpp(id: number, catatan: string): Promise<void> {
  await api.post(`/api/pengawas/ppp/${id}/kembalikan`, { catatan })
}
