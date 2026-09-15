package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * "Dokumen Program" (DOK PROG di diagram alur Dukungan Audit): dokumen
 * referensi/regulasi yang dibuat Dukungan Audit (status Draft), lalu
 * diperiksa & disetujui Kepala SPI (status Checked -> Approved). Lihat
 * DukunganAuditDokumenController & KepalaSpiDokumenController.
 */
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

    // Draft (dibuat Dukungan Audit) -> Checked -> Approved (dua tahap
    // terakhir oleh Kepala SPI). Default "Draft" di level aplikasi, lihat
    // DukunganAuditDokumenController.
    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direview_oleh")
    private User direviewOleh;

    @Column(name = "created_at")
    private Instant createdAt;

    // Berkas PDF asli (menggantikan field file_url yang tadinya diisi
    // manual sebagai teks link) -- disimpan langsung di database (bytea),
    // sama seperti pola di entity Pkpt.
    @Lob
    @Column(name = "file_bukti_data")
    private byte[] fileBuktiData;

    @Column(name = "file_bukti_nama")
    private String fileBuktiNama;

    @Column(name = "file_bukti_ukuran")
    private Long fileBuktiUkuran;
}
