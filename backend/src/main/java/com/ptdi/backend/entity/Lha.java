package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "lha")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lha_id")
    private Integer lhaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penugasan_id", nullable = false)
    private PenugasanSta penugasan;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direviu_qa_oleh")
    private User direviuQaOleh;

    @Column(name = "status_qa")
    private String statusQa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disetujui_oleh")
    private User disetujuiOleh;

    @Column(name = "tanggal_terbit")
    private LocalDate tanggalTerbit;

    @Column(name = "file_url", length = 500)
    private String fileUrl;
}
