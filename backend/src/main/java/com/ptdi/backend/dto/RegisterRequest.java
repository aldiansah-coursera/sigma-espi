package com.ptdi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String nip;
    private String namaLengkap;
    private String email;
    private String nomorWhatsapp;
    private String unitKerja;
    private String password;
}
