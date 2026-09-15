package com.ptdi.backend.controller;

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
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Kepala SPI memeriksa (Checked) dan menyetujui (Approved) draf "Dokumen
 * Program" (DOK PROG di diagram alur) yang sudah DIAJUKAN oleh Dukungan
 * Audit (koordinator) -- penyusunan & pengajuan drafnya ada di
 * DukunganAuditDokumenController (staf cuma bisa menyusun, koordinator yang
 * mengajukan ke sini).
 */
@RestController
@RequestMapping("/api/kepala-spi/dokumen")
@RequiredArgsConstructor
public class KepalaSpiDokumenController {

    private static final String STATUS_DRAFT = "Draft";
    private static final String STATUS_DIAJUKAN = "Diajukan";
    private static final String STATUS_CHECKED = "Checked";
    private static final String STATUS_APPROVED = "Approved";

    private final RegulasiTemplateRepository regulasiTemplateRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<DokumenProgramResponse> getAll() {
        return regulasiTemplateRepository.findAllByOrderByRegulasiIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/{id}/check")
    public ResponseEntity<Void> check(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_DIAJUKAN.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Dokumen hanya bisa diperiksa dari status Diajukan");
        }
        dokumen.setStatus(STATUS_CHECKED);
        dokumen.setDireviewOleh(currentUser(jwt));
        regulasiTemplateRepository.save(dokumen);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_CHECKED.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Dokumen hanya bisa disetujui dari status Checked");
        }
        dokumen.setStatus(STATUS_APPROVED);
        dokumen.setDireviewOleh(currentUser(jwt));
        regulasiTemplateRepository.save(dokumen);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/kembalikan")
    public ResponseEntity<Void> kembalikan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_CHECKED.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Dokumen hanya bisa dikembalikan dari status Checked");
        }
        dokumen.setStatus(STATUS_DRAFT);
        dokumen.setDireviewOleh(currentUser(jwt));
        regulasiTemplateRepository.save(dokumen);
        return ResponseEntity.ok().build();
    }

    private RegulasiTemplate findDokumen(Integer id) {
        return regulasiTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dokumen tidak ditemukan"));
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
