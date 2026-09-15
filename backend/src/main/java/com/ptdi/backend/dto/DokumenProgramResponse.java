package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DokumenProgramResponse {
    private Integer regulasiId;
    private String judul;
    private String kategori;
    private String fileUrl;
    private String fileBuktiNama;
    private Long fileBuktiUkuran;
    private String status;
    private String dibuatOleh;
    private String direviewOleh;
    private String createdAt;
}
