package com.ptdi.backend.security;

public final class RoleUtil {
    private RoleUtil() {}

    public static String toRoleCode(String namaRole) {
        return "ROLE_" + namaRole.trim().toUpperCase().replace(" ", "_");
    }
}
