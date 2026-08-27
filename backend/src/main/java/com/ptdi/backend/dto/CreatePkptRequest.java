package com.ptdi.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePkptRequest {
    private Integer tahunAnggaran;
    private String namaPkpt;
    private LocalDate tanggalMulai;
    private LocalDate tanggalSelesai;
    private List<ObjekPengawasanInput> objekPengawasan;
}
