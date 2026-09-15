package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaResponse {
    private Integer penugasanId;
    private String nomorSta;
    private String tanggalTerbit;
    private String tanggalMulai;
    private String tanggalSelesai;
    private String ruangLingkup;
    private String targetAudit;
    private String objekAudit;
    private String unitKerja;
    private String periode;
    private String ketuaTim;
    private String diterbitkanOleh;
    private String statusApproval;
    private Integer pppId;
    private String dibuatOleh;
    private String didistribusikanOleh;
    private String tanggalDistribusi;
    private String catatanRevisi;
    private String komposisiTim;
}
