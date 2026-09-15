package com.ptdi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PppRequest {
    private Integer objekId;
    private String ruangLingkup;
    private String sasaranAudit;
    private String komposisiTim;
    private String tanggalMulai;
    private String tanggalSelesai;
}
