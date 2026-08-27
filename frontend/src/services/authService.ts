import { api, setStoredToken, clearStoredToken } from '../lib/api'
import type { LoginRequest, LoginResponse, AuthUser, RegisterRequest } from '../types/auth'

function toAuthUser(data: LoginResponse): AuthUser {
  return {
    userId: data.userId,
    nama: data.nama,
    email: data.email,
    role: data.role,
    unit: data.unit,
  }
}

// POST /api/auth/login — sudah tersedia di backend (AuthController).
export async function login(payload: LoginRequest): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload)
  setStoredToken(data.token)
  return toAuthUser(data)
}

// GET /api/auth/me — sudah tersedia di backend, dipakai untuk memulihkan
// sesi (validasi token tersimpan) saat aplikasi pertama kali dibuka.
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<LoginResponse>('/api/auth/me')
  return toAuthUser(data)
}

export function logout(): void {
  clearStoredToken()
}

// POST /api/auth/register
export async function register(payload: RegisterRequest): Promise<void> {
  await api.post('/api/auth/register', payload)
}

// GET /api/auth/units — publik, dipakai untuk mengisi dropdown Unit Kerja
// di form Register (sebelum pengguna login/punya token).
export async function getRegisterUnits(): Promise<string[]> {
  const { data } = await api.get<string[]>('/api/auth/units')
  return data
}
