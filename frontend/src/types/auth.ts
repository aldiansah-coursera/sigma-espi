// Bentuk data ini mencerminkan DTO backend secara langsung:
// - LoginRequest / LoginResponse -> com.ptdi.backend.dto
// - Role code selalu dalam bentuk "ROLE_XXX" (lihat RoleUtil.toRoleCode di backend)

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  userId: number
  nama: string
  email: string
  role: string
  unit: string | null
}

export interface AuthUser {
  userId: number
  nama: string
  email: string
  role: string
  unit: string | null
}

// Field pendaftaran sesuai mockup Register.
export interface RegisterRequest {
  nip: string
  namaLengkap: string
  email: string
  nomorWhatsapp: string
  unitKerja: string
  password: string
}

export interface ApiErrorResponse {
  timestamp?: string
  status?: number
  error?: string
  message: string
}
