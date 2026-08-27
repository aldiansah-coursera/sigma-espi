package com.ptdi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveUserResponse {
    private Integer id;
    private String nama;
    private String email;
    private String nip;
    private String noHp;
    private String unitKerja;
    private String role;
    private boolean aktif;
}
