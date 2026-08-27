package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "profil_kompetensi_auditor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfilKompetensiAuditor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kompetensi_id")
    private Integer kompetensiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "bidang_keahlian")
    private String bidangKeahlian;

    @Column(name = "sertifikasi")
    private String sertifikasi;

    @Column(name = "tanggal_diperoleh")
    private LocalDate tanggalDiperoleh;

    @Column(name = "status")
    private String status;
}
