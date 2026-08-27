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
}
