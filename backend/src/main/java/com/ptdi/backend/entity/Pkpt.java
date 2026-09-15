package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "pkpt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pkpt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pkpt_id")
    private Integer pkptId;

    @Column(name = "tahun_anggaran")
    private Integer tahunAnggaran;

    @Column(name = "nama_pkpt")
    private String namaPkpt;

    @Column(name = "tanggal_mulai")
    private LocalDate tanggalMulai;

    @Column(name = "tanggal_selesai")
    private LocalDate tanggalSelesai;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dibuat_oleh")
    private User dibuatOleh;

    // Alur SIGMA v3.0 tahap 05-06: draf disusun Dukungan Audit
    // (dibuatOleh), diperiksa & disahkan Kepala SPI (disahkanOleh), lalu
    // diterbitkan kembali oleh Dukungan Audit (diterbitkanOleh).
    // Status: Draft -> Diajukan -> Checked -> Approved -> Diterbitkan.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disahkan_oleh")
    private User disahkanOleh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diterbitkan_oleh")
    private User diterbitkanOleh;

    @Column(name = "tanggal_terbit")
    private LocalDate tanggalTerbit;

    @Column(name = "catatan_revisi", columnDefinition = "TEXT")
    private String catatanRevisi;
}
