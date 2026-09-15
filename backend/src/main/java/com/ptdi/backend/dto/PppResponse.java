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
public class PppResponse {
    private Integer pppId;
    private Integer objekId;
    private String namaPkpt;
    private String unitKerja;
    private String jenisPengawasan;
    private String prioritasRisiko;
    private String ruangLingkup;
    private String sasaranAudit;
    private String komposisiTim;
    private String tanggalMulai;
    private String tanggalSelesai;
    private String status;
    private String diusulkanOleh;
    private String disetujuiPengawas;
    private String disetujuiKepalaSpi;
    private String catatanRevisi;
    private String createdAt;
}
