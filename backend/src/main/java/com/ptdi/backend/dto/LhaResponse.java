package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LhaResponse {
    private Integer lhaId;
    private Integer penugasanId;
    private String nomorLha;
    private String nomorSta;
    private String objekAudit;
    private String ketuaTim;
    private int anggotaTimCount;
    private String status;
    private String statusQa;
    private String tanggalTerbit;
    private String disetujuiOleh;
    private String fileUrl;
}
