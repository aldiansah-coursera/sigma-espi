package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LhaSummaryResponse {
    private int menungguOtorisasi;
    private int lhaDiterbitkanTahunIni;
    private int criticalHighFindings;
}
