package com.ptdi.backend.controller;

import com.ptdi.backend.dto.LoginRequest;
import com.ptdi.backend.dto.LoginResponse;
import com.ptdi.backend.dto.RegisterRequest;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.UnitRepository;
import com.ptdi.backend.repository.UserRepository;
import com.ptdi.backend.security.RoleUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.expiration-hours}")
    private long expirationHours;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // Throws BadCredentialsException (-> 401 via GlobalExceptionHandler) on wrong password.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));

        requireActiveStatus(user);

        String roleCode = RoleUtil.toRoleCode(user.getRole().getNamaRole());
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationHours, ChronoUnit.HOURS);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("sigma-v2")
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("userId", user.getUserId())
                .claim("nama", user.getNama())
                .claim("role", roleCode)
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();

        LoginResponse response = LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInSeconds(expirationHours * 3600)
                .userId(user.getUserId())
                .nama(user.getNama())
                .email(user.getEmail())
                .role(roleCode)
                .unit(user.getUnit() != null ? user.getUnit().getNamaUnit() : null)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Protected endpoint whose only purpose is to prove the whole login ->
     * token -> authenticated request chain actually works end to end.
     * Reflects the CURRENT token's remaining lifetime rather than minting a
     * new one.
     */
    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));

        String roleCode = RoleUtil.toRoleCode(user.getRole().getNamaRole());
        long remainingSeconds = Math.max(0, Instant.now().until(jwt.getExpiresAt(), ChronoUnit.SECONDS));

        LoginResponse response = LoginResponse.builder()
                .token(jwt.getTokenValue())
                .tokenType("Bearer")
                .expiresInSeconds(remainingSeconds)
                .userId(user.getUserId())
                .nama(user.getNama())
                .email(user.getEmail())
                .role(roleCode)
                .unit(user.getUnit() != null ? user.getUnit().getNamaUnit() : null)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Daftar Unit Kerja untuk dropdown di form Register — publik (belum
     * ada token JWT saat pendaftaran mandiri berlangsung).
     */
    @GetMapping("/units")
    public List<String> getRegisterUnits() {
        return unitRepository.findAll().stream()
                .map(Unit::getNamaUnit)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    /**
     * Pendaftaran mandiri. User baru dibuat dengan status "Pending" dan
     * role = null — akun baru bisa dipakai login setelah Admin menetapkan
     * role dan mengaktifkannya (lihat requireActiveStatus di bawah). Unit
     * kerja dipilih langsung dari form Register (lihat GET /units di atas).
     */
    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest request) {
        if (!StringUtils.hasText(request.getNip())
                || !StringUtils.hasText(request.getNamaLengkap())
                || !StringUtils.hasText(request.getEmail())
                || !StringUtils.hasText(request.getNomorWhatsapp())
                || !StringUtils.hasText(request.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Semua field wajib diisi");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email sudah terdaftar");
        }
        if (userRepository.existsByNip(request.getNip())) {
            throw new ApiException(HttpStatus.CONFLICT, "NIP sudah terdaftar");
        }

        Unit unit = resolveUnitOrDefault(request.getUnitKerja());

        User user = User.builder()
                .nip(request.getNip().trim())
                .nama(request.getNamaLengkap().trim())
                .email(request.getEmail().trim())
                .nomorWhatsapp(request.getNomorWhatsapp().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .unit(unit)
                .role(null)
                .status("Pending")
                .createdAt(Instant.now())
                .build();

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Resolusi Unit Kerja dari form Register: cocokkan berdasarkan nama
     * (case-insensitive) kalau diisi, jatuh ke Unit pertama kalau kosong
     * atau namanya tidak dikenali — supaya pendaftaran tetap berhasil
     * meski frontend lama/terlewat mengirim unitKerja.
     */
    private Unit resolveUnitOrDefault(String unitKerja) {
        List<Unit> allUnits = unitRepository.findAll();
        if (StringUtils.hasText(unitKerja)) {
            return allUnits.stream()
                    .filter(u -> u.getNamaUnit().equalsIgnoreCase(unitKerja))
                    .findFirst()
                    .orElseGet(() -> firstUnitOrThrow(allUnits));
        }
        return firstUnitOrThrow(allUnits);
    }

    private Unit firstUnitOrThrow(List<Unit> allUnits) {
        return allUnits.stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unit belum tersedia"));
    }

    /**
     * Login sengaja diblok untuk akun yang belum "Aktif" — baik supaya
     * pendaftar yang belum disetujui tidak bisa masuk, maupun untuk
     * menghindari NPE di RoleUtil.toRoleCode() saat role masih null.
     */
    private void requireActiveStatus(User user) {
        if ("Aktif".equalsIgnoreCase(user.getStatus())) {
            return;
        }
        String message = "Pending".equalsIgnoreCase(user.getStatus())
                ? "Akun Anda masih menunggu persetujuan Admin."
                : "Akun Anda tidak aktif. Silakan hubungi Admin.";
        throw new ApiException(HttpStatus.FORBIDDEN, message);
    }
}
