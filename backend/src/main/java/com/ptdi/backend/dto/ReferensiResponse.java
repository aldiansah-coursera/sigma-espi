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
public class ReferensiResponse {
    private Integer refId;
    private String kategori;
    private String kode;
    private String nilai;
    private String dikelolaOleh;
}
