package com.ptdi.backend.security;

import com.ptdi.backend.entity.User;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User dengan email " + email + " tidak ditemukan"));

        // user.getRole() bisa null untuk akun hasil pendaftaran mandiri yang
        // masih "Pending" (belum ditetapkan role oleh Admin). Otentikasi
        // password tetap boleh berjalan (supaya pesan errornya benar-benar
        // "akun belum aktif", bukan NPE) — AuthController#login yang
        // menolak login untuk status selain "Aktif" setelah otentikasi ini
        // berhasil.
        List<GrantedAuthority> authorities = user.getRole() != null
                ? List.of(new SimpleGrantedAuthority(RoleUtil.toRoleCode(user.getRole().getNamaRole())))
                : List.of();

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }
}
