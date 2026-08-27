package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifikasi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notifikasi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notif_id")
    private Integer notifId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tipe")
    private String tipe;

    @Column(name = "pesan")
    private String pesan;

    @Column(name = "status_baca")
    private Boolean statusBaca;

    @Column(name = "tanggal_kirim")
    private LocalDateTime tanggalKirim;
}
