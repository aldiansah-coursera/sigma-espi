package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjekPengawasanResponse {
    private Integer objekId;
    private String namaPkpt;
    private String unitKerja;
    private String jenisPengawasan;
    private String prioritasRisiko;
    private String status;
}
