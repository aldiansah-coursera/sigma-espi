package com.ptdi.backend.controller;

import com.ptdi.backend.dto.ForgotPasswordRequest;
import com.ptdi.backend.dto.LoginRequest;
import com.ptdi.backend.dto.LoginResponse;
import com.ptdi.backend.dto.RegisterRequest;
import com.ptdi.backend.dto.ResetPasswordRequest;
import com.ptdi.backend.entity.PasswordResetToken;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PasswordResetTokenRepository;
import com.ptdi.backend.repository.UnitRepository;
import com.ptdi.backend.repository.UserRepository;
import com.ptdi.backend.security.RoleUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    // Aturan sama dengan validasi di frontend (RegisterPage.tsx) --
    // minimal 8 karakter, ada huruf besar, huruf kecil, dan angka. Dicek
    // ulang di sini supaya tidak bisa dilewati dengan memanggil API
    // register langsung tanpa lewat form.
    private static final Pattern PASSWORD_STRENGTH_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

    // Format NIP PNS Indonesia: tepat 18 digit angka. Sama dengan validasi
    // di frontend (RegisterPage.tsx), dicek ulang di sini supaya tidak bisa
    // dilewati dengan memanggil API register langsung tanpa lewat form.
    private static final Pattern NIP_PATTERN = Pattern.compile("^\\d{18}$");

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.jwt.expiration-hours}")
    private long expirationHours;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private static final long RESET_TOKEN_VALID_HOURS = 1;

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
     * Langkah 1 alur "Lupa Password": user kirim email, sistem generate
     * token sekali-pakai (berlaku 1 jam) dan kirim link reset lewat email.
     * Email yang tidak terdaftar ditolak dengan pesan error yang jelas
     * (bukan email-enumeration-safe lagi -- sesuai kebutuhan aplikasi
     * internal ini, user harus tahu kalau akunnya belum terdaftar
     * daripada menunggu email yang tidak akan pernah datang).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (!StringUtils.hasText(request.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email wajib diisi");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Email tidak terdaftar di sistem SIGMA eSPI. Pastikan email yang Anda masukkan sudah benar, "
                                + "atau daftar akun baru terlebih dahulu."));

        issueResetTokenAndSendEmail(user);
        return ResponseEntity.ok().build();
    }

    /**
     * Langkah 2: user submit token (dari link email) + password baru.
     * Token hanya valid sekali pakai dan kedaluwarsa setelah
     * RESET_TOKEN_VALID_HOURS jam.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (!StringUtils.hasText(request.getToken()) || !StringUtils.hasText(request.getNewPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Token dan password baru wajib diisi");
        }
        if (!PASSWORD_STRENGTH_PATTERN.matcher(request.getNewPassword()).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Password minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan angka");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Link reset password tidak valid"));

        if (resetToken.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Link reset password ini sudah pernah dipakai");
        }
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Link reset password sudah kedaluwarsa, silakan minta link baru");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok().build();
    }

    private void issueResetTokenAndSendEmail(User user) {
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plus(RESET_TOKEN_VALID_HOURS, ChronoUnit.HOURS))
                .used(false)
                .createdAt(Instant.now())
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Reset Password SIGMA eSPI");
        message.setText("Halo " + user.getNama() + ",\n\n"
                + "Kami menerima permintaan untuk mereset password akun SIGMA eSPI Anda.\n"
                + "Klik link berikut untuk membuat password baru (berlaku " + RESET_TOKEN_VALID_HOURS + " jam):\n\n"
                + resetLink + "\n\n"
                + "Kalau Anda tidak meminta ini, abaikan saja email ini -- password Anda tidak akan berubah.\n\n"
                + "Salam,\nSIGMA eSPI - PT Dirgantara Indonesia");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Gagal mengirim email reset password ke {}: {}", user.getEmail(), ex.getMessage(), ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Gagal mengirim email reset password. Konfigurasi SMTP server belum benar, hubungi Admin/developer sistem.");
        }
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

        if (!NIP_PATTERN.matcher(request.getNip().trim()).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NIP harus terdiri dari 18 digit angka (format NIP PNS)");
        }
        if (!PASSWORD_STRENGTH_PATTERN.matcher(request.getPassword()).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Password minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan angka");
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

        sendRegistrationConfirmationEmail(user);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Email konfirmasi pendaftaran (poin review klien: "belum ada
     * konfirmasi email"). Dikirim best-effort -- kalau SMTP belum
     * dikonfigurasi/gagal, pendaftaran TETAP berhasil (tidak ikut
     * di-rollback), cuma dicatat ke log server, supaya pendaftaran tidak
     * gagal total hanya karena email gagal terkirim.
     */
    private void sendRegistrationConfirmationEmail(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Pendaftaran SIGMA eSPI Diterima");
        message.setText("Halo " + user.getNama() + ",\n\n"
                + "Pendaftaran akun SIGMA eSPI Anda sudah kami terima dan sedang menunggu\n"
                + "persetujuan serta penetapan role oleh Admin.\n\n"
                + "Anda akan bisa masuk (login) setelah akun diaktifkan oleh Admin.\n\n"
                + "Salam,\nSIGMA eSPI - PT Dirgantara Indonesia");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Gagal mengirim email konfirmasi pendaftaran ke " + user.getEmail()
                    + ": " + ex.getMessage());
        }
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
