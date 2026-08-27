import axios from 'axios'
import type { ApiErrorResponse } from '../types/auth'

// Backend Spring Boot berjalan di localhost:8080 (lihat docker-compose.yml).
// CORS sudah dikonfigurasi backend khusus untuk origin http://localhost:5173,
// jadi panggilan langsung dari browser (tanpa proxy Vite) sudah didukung.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

const TOKEN_STORAGE_KEY = 'sigma_auth_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// GlobalExceptionHandler backend selalu mengembalikan { message: "..." }
// pada error (401 login gagal, dll). Fallback dipakai untuk kasus jaringan
// putus atau endpoint yang belum ada (mis. register).
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined
    if (data?.message) return data.message
    if (!err.response) return 'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.'
    if (err.response.status === 404) return 'Endpoint belum tersedia di backend.'
  }
  return fallback
}
