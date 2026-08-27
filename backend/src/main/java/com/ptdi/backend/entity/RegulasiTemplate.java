package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regulasi_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulasiTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "regulasi_id")
    private Integer regulasiId;

    @Column(name = "judul")
    private String judul;

    @Column(name = "kategori")
    private String kategori;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
