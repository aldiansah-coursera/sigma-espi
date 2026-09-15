package com.ptdi.backend.controller;

import com.ptdi.backend.dto.KompetensiRequest;
import com.ptdi.backend.dto.KompetensiResponse;
import com.ptdi.backend.dto.UserOption;
import com.ptdi.backend.entity.ProfilKompetensiAuditor;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.ProfilKompetensiAuditorRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Tahap 04 flowmap SIGMA v3.0 -- Administrator "Mengelola Profil &
 * Kompetensi Auditor": mencatat bidang keahlian & sertifikasi tiap auditor,
 * dipakai sebagai bahan pertimbangan saat menyusun komposisi tim di PPP.
 */
@RestController
@RequestMapping("/api/admin/kompetensi")
@RequiredArgsConstructor
public class AdminKompetensiController {

    public static final List<String> STATUS_TERSEDIA = List.of("Aktif", "Kedaluwarsa", "Dalam Proses");

    // Role yang boleh punya profil kompetensi -- hanya pelaksana audit.
    private static final Set<String> ROLE_AUDITOR = Set.of("Auditor", "Ketua Tim");

    private final ProfilKompetensiAuditorRepository profilKompetensiAuditorRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<KompetensiResponse> getAll() {
        return profilKompetensiAuditorRepository.findAll().stream()
                .sorted(Comparator.comparing((ProfilKompetensiAuditor p) ->
                        p.getUser() != null ? p.getUser().getNama() : "", Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
    }

    /** Dropdown auditor yang bisa dibuatkan profil kompetensi. */
    @GetMapping("/auditor-options")
    public List<UserOption> getAuditorOptions() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && ROLE_AUDITOR.contains(u.getRole().getNamaRole()))
                .sorted(Comparator.comparing(User::getNama, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(u -> UserOption.builder().id(u.getUserId()).nama(u.getNama()).build())
                .toList();
    }

    @GetMapping("/status-options")
    public List<String> getStatusOptions() {
        return STATUS_TERSEDIA;
    }

    @PostMapping
    public ResponseEntity<KompetensiResponse> create(@RequestBody KompetensiRequest request) {
        validate(request);
        User auditor = resolveAuditor(request.getUserId());

        ProfilKompetensiAuditor profil = ProfilKompetensiAuditor.builder()
                .user(auditor)
                .bidangKeahlian(request.getBidangKeahlian().trim())
                .sertifikasi(StringUtils.hasText(request.getSertifikasi()) ? request.getSertifikasi().trim() : null)
                .tanggalDiperoleh(parseTanggal(request.getTanggalDiperoleh()))
                .status(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "Aktif")
                .build();
        profil = profilKompetensiAuditorRepository.save(profil);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(profil));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KompetensiResponse> update(@PathVariable Integer id, @RequestBody KompetensiRequest request) {
        validate(request);
        ProfilKompetensiAuditor profil = findOrThrow(id);

        profil.setUser(resolveAuditor(request.getUserId()));
        profil.setBidangKeahlian(request.getBidangKeahlian().trim());
        profil.setSertifikasi(StringUtils.hasText(request.getSertifikasi()) ? request.getSertifikasi().trim() : null);
        profil.setTanggalDiperoleh(parseTanggal(request.getTanggalDiperoleh()));
        profil.setStatus(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "Aktif");
        profilKompetensiAuditorRepository.save(profil);

        return ResponseEntity.ok(toResponse(profil));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        profilKompetensiAuditorRepository.delete(findOrThrow(id));
        return ResponseEntity.ok().build();
    }

    private void validate(KompetensiRequest request) {
        if (request == null || request.getUserId() == null || !StringUtils.hasText(request.getBidangKeahlian())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Auditor dan bidang keahlian wajib diisi");
        }
        if (StringUtils.hasText(request.getStatus()) && !STATUS_TERSEDIA.contains(request.getStatus().trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status kompetensi tidak dikenali");
        }
    }

    private User resolveAuditor(Integer userId) {
        User auditor = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Auditor tidak ditemukan"));
        if (auditor.getRole() == null || !ROLE_AUDITOR.contains(auditor.getRole().getNamaRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Profil kompetensi hanya untuk user ber-role Auditor atau Ketua Tim");
        }
        return auditor;
    }

    private LocalDate parseTanggal(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tanggal diperoleh tidak valid");
        }
    }

    private ProfilKompetensiAuditor findOrThrow(Integer id) {
        return profilKompetensiAuditorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil kompetensi tidak ditemukan"));
    }

    private KompetensiResponse toResponse(ProfilKompetensiAuditor p) {
        User u = p.getUser();
        return KompetensiResponse.builder()
                .kompetensiId(p.getKompetensiId())
                .userId(u != null ? u.getUserId() : null)
                .namaAuditor(u != null ? u.getNama() : null)
                .roleAuditor(u != null && u.getRole() != null ? u.getRole().getNamaRole() : null)
                .unitKerja(u != null && u.getUnit() != null ? u.getUnit().getNamaUnit() : null)
                .bidangKeahlian(p.getBidangKeahlian())
                .sertifikasi(p.getSertifikasi())
                .tanggalDiperoleh(p.getTanggalDiperoleh() != null ? p.getTanggalDiperoleh().toString() : null)
                .status(p.getStatus())
                .build();
    }
}
