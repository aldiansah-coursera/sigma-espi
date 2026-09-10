package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenugasanOption {
    private Integer penugasanId;
    private String nomorSta;
    private String objekAudit;
}
