package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * PPP = Program & Pengajuan Penugasan (tahap 06-07 flowmap SIGMA v3.0,
 * Bagian V.A dokumen 83-AP-003A). Rantainya sesuai arahan klien: Ketua Tim
 * MENGUSULKAN, Pengawas (Ka. Departemen Pengawasan) MENYETUJUI &
 * MENERUSKAN, lalu Kepala SPI selaku Penanggung Jawab MENYETUJUI.
 *
 * Status: Draft -> Diajukan (ke Pengawas) -> Diteruskan (ke Kepala SPI)
 * -> Disetujui. Kalau dikembalikan, status balik ke Draft + catatanRevisi.
 */
@Entity
@Table(name = "penugasan_ppp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenugasanPpp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ppp_id")
    private Integer pppId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objek_id", nullable = false)
    private ObjekPengawasan objek;

    @Column(name = "ruang_lingkup", columnDefinition = "TEXT")
    private String ruangLingkup;

    @Column(name = "sasaran_audit", columnDefinition = "TEXT")
    private String sasaranAudit;

    /** Daftar anggota tim yang diusulkan, ditulis bebas oleh Ketua Tim. */
    @Column(name = "komposisi_tim", columnDefinition = "TEXT")
    private String komposisiTim;

    @Column(name = "tanggal_mulai")
    private LocalDate tanggalMulai;

    @Column(name = "tanggal_selesai")
    private LocalDate tanggalSelesai;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diusulkan_oleh")
    private User diusulkanOleh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disetujui_pengawas")
    private User disetujuiPengawas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disetujui_kepala_spi")
    private User disetujuiKepalaSpi;

    @Column(name = "catatan_revisi", columnDefinition = "TEXT")
    private String catatanRevisi;

    @Column(name = "created_at")
    private Instant createdAt;
}
