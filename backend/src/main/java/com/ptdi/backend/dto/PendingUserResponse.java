package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingUserResponse {
    private Integer id;
    private String nama;
    private String email;
    private String nip;
    private String noHp;
    private String unitKerja;
    private String tanggalDaftar;
    private String role;
}
