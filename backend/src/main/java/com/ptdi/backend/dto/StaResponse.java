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
    private String objekAudit;
    private String unitKerja;
    private String periode;
    private String ketuaTim;
    private String diterbitkanOleh;
    private String statusApproval;
}
