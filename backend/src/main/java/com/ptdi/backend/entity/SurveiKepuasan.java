package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "survei_kepuasan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveiKepuasan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "survei_id")
    private Integer surveiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penugasan_id", nullable = false)
    private PenugasanSta penugasan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditee_id")
    private User auditee;

    @Column(name = "skor")
    private Integer skor;

    @Column(name = "komentar", columnDefinition = "TEXT")
    private String komentar;

    @Column(name = "tanggal")
    private LocalDate tanggal;
}
