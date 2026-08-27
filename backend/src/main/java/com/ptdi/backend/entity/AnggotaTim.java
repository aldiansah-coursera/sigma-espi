package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "anggota_tim")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnggotaTim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "anggota_id")
    private Integer anggotaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penugasan_id", nullable = false)
    private PenugasanSta penugasan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "peran_dalam_tim")
    private String peranDalamTim;
}
