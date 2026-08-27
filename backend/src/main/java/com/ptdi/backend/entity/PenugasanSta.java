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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ketua_tim_id", nullable = false)
    private User ketuaTim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diterbitkan_oleh")
    private User diterbitkanOleh;

    @Column(name = "status_approval")
    private String statusApproval;
}
