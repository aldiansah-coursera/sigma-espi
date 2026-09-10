package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PkaResponse {
    private Integer pkaId;
    private Integer penugasanId;
    private String nomorSta;
    private String objekAudit;
    private String langkahKerja;
    private String alokasiWaktu;
    private String statusPersetujuan;
    private String disetujuiOleh;
}
