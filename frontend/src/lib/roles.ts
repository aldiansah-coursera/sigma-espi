// Daftar 6 role RBAC sesuai project brief SIGMA v2.0. `namaRole` adalah nilai
// mentah yang di-seed backend (DataSeeder), `code` adalah bentuk klaim JWT
// "ROLE_XXX" yang dikembalikan backend (lihat RoleUtil.toRoleCode).
export interface RoleOption {
  namaRole: string
  code: string
}

export const ROLE_OPTIONS: RoleOption[] = [
  { namaRole: 'Admin', code: 'ROLE_ADMIN' },
  { namaRole: 'Auditor', code: 'ROLE_AUDITOR' },
  { namaRole: 'Ketua Tim', code: 'ROLE_KETUA_TIM' },
  { namaRole: 'Kepala SPI', code: 'ROLE_KEPALA_SPI' },
  { namaRole: 'Tim QA', code: 'ROLE_TIM_QA' },
  { namaRole: 'Auditee', code: 'ROLE_AUDITEE' },
]

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.code, r.namaRole]),
)

export const ADMIN_ROLE_CODE = 'ROLE_ADMIN'
export const KEPALA_SPI_ROLE_CODE = 'ROLE_KEPALA_SPI'

export function roleLabel(roleCode: string): string {
  return ROLE_LABELS[roleCode] ?? roleCode.replace(/^ROLE_/, '')
}

// Dashboard role selain Admin & Kepala SPI belum dibangun (menyusul kemudian
// sesuai arahan pengguna), jadi role lain diarahkan ke halaman placeholder.
export function resolveHomeRoute(roleCode: string): string {
  if (roleCode === ADMIN_ROLE_CODE) return '/admin/dashboard'
  if (roleCode === KEPALA_SPI_ROLE_CODE) return '/kepala-spi/dashboard'
  return '/coming-soon'
}
