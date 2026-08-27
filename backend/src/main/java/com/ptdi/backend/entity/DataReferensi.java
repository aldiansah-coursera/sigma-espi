package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "data_referensi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataReferensi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ref_id")
    private Integer refId;

    @Column(name = "kategori")
    private String kategori;

    @Column(name = "kode")
    private String kode;

    @Column(name = "nilai")
    private String nilai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dikelola_oleh")
    private User dikelolaOleh;
}
