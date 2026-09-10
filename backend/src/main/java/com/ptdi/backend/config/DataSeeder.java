package com.ptdi.backend.config;

import com.ptdi.backend.entity.Role;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.repository.RoleRepository;
import com.ptdi.backend.repository.UnitRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Idempotent startup seeder — safe to run on every restart. Roles/Admin
 * account are only seeded on a fully empty table (count() == 0); Unit is
 * seeded per-name (insert only the ones missing) so adding a new example
 * unit here still takes effect on a database that's already been seeded
 * once. Seeds the 6 RBAC roles from the project brief, a handful of
 * contoh (example) Unit Kerja, and one Admin account so there is
 * something to log in with on a fresh database.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final List<String> ROLE_NAMES = List.of(
            "Admin", "Auditor", "Ketua Tim", "Kepala SPI", "Pengawas", "Tim Jaminan Kualitas", "Auditee"
    );

    // Nama role lama yang berubah nama setelah masukan review klien --
    // dipakai untuk migrasi ringan di bawah supaya database yang sudah
    // pernah ke-seed (roleRepository.count() != 0, jadi ROLE_NAMES di atas
    // tidak otomatis kepakai lagi) ikut ter-update juga, bukan cuma
    // database baru.
    private static final String OLD_ROLE_TIM_QA = "Tim QA";
    private static final String NEW_ROLE_TIM_JAMINAN_KUALITAS = "Tim Jaminan Kualitas";
    private static final String NEW_ROLE_PENGAWAS = "Pengawas";

    // Contoh Unit Kerja — silakan tambah/ubah daftar ini sesuai struktur
    // organisasi PTDI yang sebenarnya. "Kantor Pusat" dipertahankan sebagai
    // unit pertama karena dipakai sebagai default unit akun Admin seed.
    private static final List<String> UNIT_NAMES = List.of(
            "Kantor Pusat",
            "Kantor Cabang Jakarta",
            "Kantor Cabang Surabaya",
            "Divisi Produksi",
            "Divisi Teknik & Rekayasa",
            "Divisi Keuangan & SDM"
    );

    private static final String SEED_ADMIN_EMAIL = "admin@sigma.id";
    private static final String SEED_ADMIN_PASSWORD = "Admin@123";

    private final RoleRepository roleRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (roleRepository.count() == 0) {
            ROLE_NAMES.forEach(nama -> roleRepository.save(Role.builder().namaRole(nama).build()));
        } else {
            // Migrasi ringan untuk database yang sudah pernah ke-seed
            // sebelumnya (lihat komentar OLD_ROLE_TIM_QA di atas).
            List<Role> existingRoles = roleRepository.findAll();

            existingRoles.stream()
                    .filter(r -> OLD_ROLE_TIM_QA.equals(r.getNamaRole()))
                    .findFirst()
                    .ifPresent(r -> {
                        boolean sudahAdaNamaBaru = existingRoles.stream()
                                .anyMatch(other -> NEW_ROLE_TIM_JAMINAN_KUALITAS.equals(other.getNamaRole()));
                        if (!sudahAdaNamaBaru) {
                            r.setNamaRole(NEW_ROLE_TIM_JAMINAN_KUALITAS);
                            roleRepository.save(r);
                        }
                    });

            boolean pengawasSudahAda = existingRoles.stream()
                    .anyMatch(r -> NEW_ROLE_PENGAWAS.equals(r.getNamaRole()));
            if (!pengawasSudahAda) {
                roleRepository.save(Role.builder().namaRole(NEW_ROLE_PENGAWAS).build());
            }
        }

        List<String> existingUnitNames = unitRepository.findAll().stream()
                .map(Unit::getNamaUnit)
                .toList();
        UNIT_NAMES.stream()
                .filter(nama -> !existingUnitNames.contains(nama))
                .forEach(nama -> unitRepository.save(Unit.builder().namaUnit(nama).build()));

        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findAll().stream()
                    .filter(r -> "Admin".equals(r.getNamaRole()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Role Admin belum ke-seed"));

            Unit kantorPusat = unitRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Unit belum ke-seed"));

            User admin = User.builder()
                    .nama("Administrator")
                    .email(SEED_ADMIN_EMAIL)
                    .password(passwordEncoder.encode(SEED_ADMIN_PASSWORD))
                    .role(adminRole)
                    .unit(kantorPusat)
                    .status("Aktif")
                    .build();

            userRepository.save(admin);
        }
    }
}
