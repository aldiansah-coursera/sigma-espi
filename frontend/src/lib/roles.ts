// Daftar role RBAC sesuai project brief SIGMA v2.0 (sudah disesuaikan
// dengan masukan review klien: role "Pengawas" ditambahkan, dan "Tim QA"
// diganti nama jadi "Tim Jaminan Kualitas"). `namaRole` adalah nilai
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
  { namaRole: 'Pengawas', code: 'ROLE_PENGAWAS' },
  { namaRole: 'Tim Jaminan Kualitas', code: 'ROLE_TIM_JAMINAN_KUALITAS' },
  { namaRole: 'Auditee', code: 'ROLE_AUDITEE' },
  { namaRole: 'Dukungan Audit', code: 'ROLE_DUKUNGAN_AUDIT' },
  { namaRole: 'Dukungan Audit Staff', code: 'ROLE_DUKUNGAN_AUDIT_STAFF' },
]

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.code, r.namaRole]),
)

export const ADMIN_ROLE_CODE = 'ROLE_ADMIN'
export const KEPALA_SPI_ROLE_CODE = 'ROLE_KEPALA_SPI'
export const KETUA_TIM_ROLE_CODE = 'ROLE_KETUA_TIM'
export const AUDITOR_ROLE_CODE = 'ROLE_AUDITOR'
export const PENGAWAS_ROLE_CODE = 'ROLE_PENGAWAS'
export const JAMINAN_KUALITAS_ROLE_CODE = 'ROLE_TIM_JAMINAN_KUALITAS'
export const AUDITEE_ROLE_CODE = 'ROLE_AUDITEE'
export const DUKUNGAN_AUDIT_ROLE_CODE = 'ROLE_DUKUNGAN_AUDIT'
export const DUKUNGAN_AUDIT_STAFF_ROLE_CODE = 'ROLE_DUKUNGAN_AUDIT_STAFF'

export function roleLabel(roleCode: string): string {
  return ROLE_LABELS[roleCode] ?? roleCode.replace(/^ROLE_/, '')
}

// Dashboard role selain Admin & Kepala SPI belum dibangun (menyusul kemudian
// sesuai arahan pengguna), jadi role lain diarahkan ke halaman placeholder.
export function resolveHomeRoute(roleCode: string): string {
  if (roleCode === ADMIN_ROLE_CODE) return '/admin/dashboard'
  if (roleCode === KEPALA_SPI_ROLE_CODE) return '/kepala-spi/dashboard'
  if (roleCode === KETUA_TIM_ROLE_CODE) return '/ketua-tim/dashboard'
  if (roleCode === AUDITOR_ROLE_CODE) return '/auditor/dashboard'
  if (roleCode === PENGAWAS_ROLE_CODE) return '/pengawas-tim/dashboard'
  if (roleCode === JAMINAN_KUALITAS_ROLE_CODE) return '/jaminan-kualitas/dashboard'
  if (roleCode === AUDITEE_ROLE_CODE) return '/auditee/beranda'
  if (roleCode === DUKUNGAN_AUDIT_ROLE_CODE) return '/dukungan-audit/dashboard'
  if (roleCode === DUKUNGAN_AUDIT_STAFF_ROLE_CODE) return '/dukungan-audit/dashboard'
  return '/coming-soon'
}
