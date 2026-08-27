package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "tindak_lanjut")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TindakLanjut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tl_id")
    private Integer tlId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "temuan_id", nullable = false)
    private TemuanKkpt temuan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditee_id")
    private User auditee;

    @Column(name = "rencana_aksi", columnDefinition = "TEXT")
    private String rencanaAksi;

    @Column(name = "tanggal_komitmen")
    private LocalDate tanggalKomitmen;

    @Column(name = "status_rekon")
    private String statusRekon;
}
