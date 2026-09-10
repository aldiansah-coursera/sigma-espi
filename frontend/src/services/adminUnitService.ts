import { api } from '../lib/api'

export interface UnitItem {
  id: number
  namaUnit: string
}

// GET /api/admin/units/manage -- daftar Unit Kerja lengkap dengan id,
// dipakai halaman Kelola Unit Kerja (beda dari getUnits() di
// userService.ts yang cuma balikin nama string untuk dropdown).
export async function getUnitsForManagement(): Promise<UnitItem[]> {
  const { data } = await api.get<UnitItem[]>('/api/admin/units/manage')
  return data
}

export async function createUnit(namaUnit: string): Promise<UnitItem> {
  const { data } = await api.post<UnitItem>('/api/admin/units', { namaUnit })
  return data
}

export async function updateUnit(id: number, namaUnit: string): Promise<UnitItem> {
  const { data } = await api.put<UnitItem>(`/api/admin/units/${id}`, { namaUnit })
  return data
}

export async function deleteUnit(id: number): Promise<void> {
  await api.delete(`/api/admin/units/${id}`)
}
