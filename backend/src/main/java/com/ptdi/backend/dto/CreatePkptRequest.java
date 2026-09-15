package com.ptdi.backend.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePkptRequest {
    private Integer tahunAnggaran;
    private String namaPkpt;
    private LocalDate tanggalMulai;
    private LocalDate tanggalSelesai;
}
