package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PkptResponse {
    private Integer pkptId;
    private Integer tahunAnggaran;
    private String namaPkpt;
    private String tanggalMulai;
    private String tanggalSelesai;
    private String status;
    private String dibuatOleh;
    private int totalObjek;
}
