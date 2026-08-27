package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pka")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pka {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pka_id")
    private Integer pkaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penugasan_id", nullable = false)
    private PenugasanSta penugasan;

    @Column(name = "langkah_kerja")
    private String langkahKerja;

    @Column(name = "alokasi_waktu")
    private String alokasiWaktu;

    @Column(name = "status_persetujuan")
    private String statusPersetujuan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disetujui_oleh")
    private User disetujuiOleh;
}
