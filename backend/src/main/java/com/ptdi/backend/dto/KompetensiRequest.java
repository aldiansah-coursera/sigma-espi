package com.ptdi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KompetensiRequest {
    private Integer userId;
    private String bidangKeahlian;
    private String sertifikasi;
    private String tanggalDiperoleh;
    private String status;
}
