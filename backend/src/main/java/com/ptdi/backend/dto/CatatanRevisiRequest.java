package com.ptdi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Body opsional untuk aksi "kembalikan / minta revisi" di berbagai gerbang
 * persetujuan (PKPT, PPP, ST, LHA).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CatatanRevisiRequest {
    private String catatan;
}
