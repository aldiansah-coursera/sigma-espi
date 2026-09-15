package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateDokumenProgramRequest {
    private String judul;
    private String kategori;
}
