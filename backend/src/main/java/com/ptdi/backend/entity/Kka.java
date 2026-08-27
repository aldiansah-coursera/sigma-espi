package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "kka")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kka {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kka_id")
    private Integer kkaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penugasan_id", nullable = false)
    private PenugasanSta penugasan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pembuat_id", nullable = false)
    private User pembuat;

    @Column(name = "prosedur")
    private String prosedur;

    @Column(name = "file_bukti_url", length = 500)
    private String fileBuktiUrl;

    @Column(name = "status")
    private String status;

    @Column(name = "is_locked")
    private Boolean isLocked;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "divalidasi_oleh")
    private User divalidasiOleh;

    @Column(name = "tanggal_dibuat")
    private LocalDate tanggalDibuat;
}
