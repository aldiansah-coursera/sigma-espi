package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaRequest {
    private Integer objekId;
    private Integer ketuaTimUserId;
    // Poin review klien #7: jangka waktu, ruang lingkup (scope), dan
    // target/sasaran audit wajib diisi saat menerbitkan STA.
    private String tanggalMulai;
    private String tanggalSelesai;
    private String ruangLingkup;
    private String targetAudit;
}
