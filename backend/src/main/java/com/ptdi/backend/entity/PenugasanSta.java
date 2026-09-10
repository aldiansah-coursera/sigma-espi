package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "penugasan_sta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenugasanSta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "penugasan_id")
    private Integer penugasanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objek_id", nullable = false)
    private ObjekPengawasan objek;

    @Column(name = "nomor_sta")
    private String nomorSta;

    @Column(name = "tanggal_terbit")
    private LocalDate tanggalTerbit;

    // Poin review klien #7: penugasan STA perlu jangka waktu (mulai/selesai)
    // yang jelas, bukan cuma tanggal terbit saja.
    @Column(name = "tanggal_mulai")
    private LocalDate tanggalMulai;

    @Column(name = "tanggal_selesai")
    private LocalDate tanggalSelesai;

    // Ruang lingkup (scope) & target/sasaran audit untuk penugasan ini --
    // sesuai masukan review klien #7.
    @Column(name = "ruang_lingkup", columnDefinition = "TEXT")
    private String ruangLingkup;

    @Column(name = "target_audit", columnDefinition = "TEXT")
    private String targetAudit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ketua_tim_id", nullable = false)
    private User ketuaTim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diterbitkan_oleh")
    private User diterbitkanOleh;

    @Column(name = "status_approval")
    private String statusApproval;
}
