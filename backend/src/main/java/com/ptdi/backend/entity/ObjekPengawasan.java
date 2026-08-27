package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "objek_pengawasan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjekPengawasan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "objek_id")
    private Integer objekId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pkpt_id", nullable = false)
    private Pkpt pkpt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @Column(name = "jenis_pengawasan")
    private String jenisPengawasan;

    @Column(name = "prioritas_risiko")
    private String prioritasRisiko;

    @Column(name = "status")
    private String status;
}
