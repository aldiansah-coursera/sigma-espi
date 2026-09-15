package com.ptdi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KompetensiResponse {
    private Integer kompetensiId;
    private Integer userId;
    private String namaAuditor;
    private String roleAuditor;
    private String unitKerja;
    private String bidangKeahlian;
    private String sertifikasi;
    private String tanggalDiperoleh;
    private String status;
}
