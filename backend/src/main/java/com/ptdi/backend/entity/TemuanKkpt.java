package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "temuan_kkpt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemuanKkpt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "temuan_id")
    private Integer temuanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kka_id", nullable = false)
    private Kka kka;

    @Column(name = "kondisi", columnDefinition = "TEXT")
    private String kondisi;

    @Column(name = "kriteria", columnDefinition = "TEXT")
    private String kriteria;

    @Column(name = "penyebab", columnDefinition = "TEXT")
    private String penyebab;

    @Column(name = "akibat", columnDefinition = "TEXT")
    private String akibat;

    @Column(name = "rekomendasi", columnDefinition = "TEXT")
    private String rekomendasi;

    @Column(name = "prioritas")
    private String prioritas;

    @Column(name = "status_konfirmasi")
    private String statusKonfirmasi;
}
