import { api } from '../lib/api'
import { ROLE_OPTIONS } from '../lib/roles'

export interface PendingUser {
  id: number
  nama: string
  email: string
  nip: string
  noHp: string
  unitKerja: string
  tanggalDaftar: string
  role: string | null
}

export interface ActiveUser {
  id: number
  nama: string
  email: string
  nip: string
  noHp: string
  unitKerja: string
  role: string
  aktif: boolean
}

export async function getPendingUsers(): Promise<PendingUser[]> {
  const { data } = await api.get<PendingUser[]>('/api/admin/users/pending')
  return data
}

export async function getActiveUsers(): Promise<ActiveUser[]> {
  const { data } = await api.get<ActiveUser[]>('/api/admin/users/active')
  return data
}

export async function setPendingUserRole(id: number, role: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/role`, { role })
}

export async function changeActiveUserRole(id: number, role: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/change-role`, { role })
}

export async function approvePendingUser(id: number): Promise<void> {
  await api.post(`/api/admin/users/${id}/approve`)
}

export async function rejectPendingUser(id: number): Promise<void> {
  await api.post(`/api/admin/users/${id}/reject`)
}

export async function toggleActiveUserStatus(id: number): Promise<void> {
  await api.post(`/api/admin/users/${id}/toggle-status`)
}

export async function deleteActiveUser(id: number): Promise<void> {
  await api.post(`/api/admin/users/${id}/delete`)
}

export async function getUnits(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/admin/units')
  return data
}

export async function changeActiveUserUnit(id: number, unitKerja: string): Promise<void> {
  await api.post(`/api/admin/users/${id}/change-unit`, { unitKerja })
}

export function availableRoleNames(): string[] {
  return ROLE_OPTIONS.map((r) => r.namaRole)
}
