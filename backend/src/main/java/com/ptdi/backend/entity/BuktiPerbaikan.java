package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "bukti_perbaikan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuktiPerbaikan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bukti_id")
    private Integer buktiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tl_id", nullable = false)
    private TindakLanjut tindakLanjut;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "tanggal_validasi")
    private LocalDate tanggalValidasi;

    @Column(name = "status_validasi")
    private String statusValidasi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "divalidasi_oleh")
    private User divalidasiOleh;
}
