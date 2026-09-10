package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePkaRequest {
    private Integer penugasanId;
    private String langkahKerja;
    private String alokasiWaktu;
}
