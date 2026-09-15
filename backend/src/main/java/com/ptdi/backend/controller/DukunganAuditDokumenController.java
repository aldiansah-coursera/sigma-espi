package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreateDokumenProgramRequest;
import com.ptdi.backend.dto.DokumenProgramResponse;
import com.ptdi.backend.entity.RegulasiTemplate;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.RegulasiTemplateRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Dukungan Audit menyusun draf "Dokumen Program" (DOK PROG di diagram alur).
 * Ada 2 tingkatan role di sini (sesuai data kepegawaian klien): "Dukungan
 * Audit Staff" cuma bisa menyusun/menyimpan draf (status Draft), sedangkan
 * "Dukungan Audit" (koordinator) yang mengajukan draf itu ke Kepala SPI
 * (status Draft -> Diajukan) lewat endpoint ajukan() di bawah -- staf TIDAK
 * bisa mengajukan langsung. Pemeriksaan (Checked) & persetujuan (Approved)
 * dokumen yang sudah diajukan dilakukan Kepala SPI, lihat
 * KepalaSpiDokumenController.
 */
@RestController
@RequestMapping("/api/dukungan-audit/dokumen")
@RequiredArgsConstructor
public class DukunganAuditDokumenController {

    private static final String STATUS_DRAFT = "Draft";
    private static final String STATUS_DIAJUKAN = "Diajukan";
    private static final String ROLE_DUKUNGAN_AUDIT_KOORDINATOR = "Dukungan Audit";

    private final RegulasiTemplateRepository regulasiTemplateRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<DokumenProgramResponse> getAll() {
        return regulasiTemplateRepository.findAllByOrderByRegulasiIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreateDokumenProgramRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (!StringUtils.hasText(request.getJudul()) || !StringUtils.hasText(request.getKategori())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Judul dan kategori dokumen wajib diisi");
        }

        RegulasiTemplate dokumen = RegulasiTemplate.builder()
                .judul(request.getJudul().trim())
                .kategori(request.getKategori().trim())
                .fileUrl(StringUtils.hasText(request.getFileUrl()) ? request.getFileUrl().trim() : null)
                .status(STATUS_DRAFT)
                .uploadedBy(currentUser(jwt))
                .createdAt(Instant.now())
                .build();
        regulasiTemplateRepository.save(dokumen);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        User current = currentUser(jwt);
        boolean isKoordinator = current.getRole() != null
                && ROLE_DUKUNGAN_AUDIT_KOORDINATOR.equals(current.getRole().getNamaRole());
        if (!isKoordinator) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Hanya Dukungan Audit (koordinator) yang bisa mengajukan dokumen ke Kepala SPI");
        }

        RegulasiTemplate dokumen = regulasiTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dokumen tidak ditemukan"));
        if (!STATUS_DRAFT.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Dokumen hanya bisa diajukan dari status Draft");
        }
        dokumen.setStatus(STATUS_DIAJUKAN);
        regulasiTemplateRepository.save(dokumen);

        return ResponseEntity.ok().build();
    }

    private DokumenProgramResponse toResponse(RegulasiTemplate r) {
        return DokumenProgramResponse.builder()
                .regulasiId(r.getRegulasiId())
                .judul(r.getJudul())
                .kategori(r.getKategori())
                .fileUrl(r.getFileUrl())
                .status(r.getStatus())
                .dibuatOleh(r.getUploadedBy() != null ? r.getUploadedBy().getNama() : null)
                .direviewOleh(r.getDireviewOleh() != null ? r.getDireviewOleh().getNama() : null)
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .build();
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
