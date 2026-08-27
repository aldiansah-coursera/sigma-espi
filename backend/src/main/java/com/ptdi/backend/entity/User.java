package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "nama", nullable = false)
    private String nama;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    // NIP dan nomor WhatsApp hanya diisi lewat alur pendaftaran mandiri
    // (POST /api/auth/register), jadi tetap nullable di level kolom supaya
    // akun lama (mis. seed Admin) yang tidak punya nilai ini tidak melanggar
    // constraint.
    @Column(name = "nip", unique = true)
    private String nip;

    @Column(name = "nomor_whatsapp")
    private String nomorWhatsapp;

    // Nullable: user hasil pendaftaran mandiri belum punya role sampai
    // Admin menetapkannya (lihat status = "Pending" di bawah).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = true)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    // Nilai yang dipakai: "Pending" (baru daftar, menunggu Admin), "Aktif",
    // "Nonaktif". Lihat AuthController#register dan #login.
    @Column(name = "status")
    private String status;

    // Kapan user mendaftar — dipakai dashboard Admin untuk kolom "Tgl
    // Daftar" di tabel persetujuan. Nullable karena akun seed (Admin awal)
    // dibuat tanpa nilai ini.
    @Column(name = "created_at")
    private Instant createdAt;
}
