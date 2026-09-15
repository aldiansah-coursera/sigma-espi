package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreateDokumenProgramRequest;
import com.ptdi.backend.dto.DokumenProgramResponse;
import com.ptdi.backend.entity.RegulasiTemplate;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.RegulasiTemplateRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

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
    private static final String ROLE_DUKUNGAN_AUDIT_STAFF = "Dukungan Audit Staff";

    private final RegulasiTemplateRepository regulasiTemplateRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<DokumenProgramResponse> getAll() {
        return regulasiTemplateRepository.findAllByOrderByRegulasiIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<Map<String, Integer>> create(@RequestBody CreateDokumenProgramRequest request, @AuthenticationPrincipal Jwt jwt) {
        requireStaff(jwt);
        if (!StringUtils.hasText(request.getJudul()) || !StringUtils.hasText(request.getKategori())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Judul dan kategori dokumen wajib diisi");
        }

        RegulasiTemplate dokumen = RegulasiTemplate.builder()
                .judul(request.getJudul().trim())
                .kategori(request.getKategori().trim())
                .status(STATUS_DRAFT)
                .uploadedBy(currentUser(jwt))
                .createdAt(Instant.now())
                .build();
        dokumen = regulasiTemplateRepository.save(dokumen);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("regulasiId", dokumen.getRegulasiId()));
    }

    /** Unggah/ganti berkas PDF dokumen (hanya "Dukungan Audit Staff", hanya selama status Draft). */
    @PostMapping("/{id}/file")
    public ResponseEntity<Void> uploadFile(@PathVariable Integer id, @RequestParam("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
        requireStaff(jwt);
        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_DRAFT.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Berkas hanya bisa diunggah/diganti selama dokumen berstatus Draft");
        }
        validateFile(file);
        try {
            dokumen.setFileBuktiData(file.getBytes());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gagal membaca berkas yang diunggah");
        }
        dokumen.setFileBuktiNama(file.getOriginalFilename());
        dokumen.setFileBuktiUkuran(file.getSize());
        regulasiTemplateRepository.save(dokumen);
        return ResponseEntity.ok().build();
    }

    /** Berkas PDF bisa dilihat siapa saja yang punya akses ke Dokumen Program ini (Dukungan Audit, staf, & Kepala SPI). */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Integer id) {
        return buildFileResponse(findDokumen(id));
    }

    @DeleteMapping("/{id}/file")
    public ResponseEntity<Void> deleteFile(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        requireStaff(jwt);
        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_DRAFT.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Berkas hanya bisa dihapus selama dokumen berstatus Draft");
        }
        dokumen.setFileBuktiData(null);
        dokumen.setFileBuktiNama(null);
        dokumen.setFileBuktiUkuran(null);
        regulasiTemplateRepository.save(dokumen);
        return ResponseEntity.ok().build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Berkas PDF wajib dipilih");
        }
        String namaFile = file.getOriginalFilename();
        boolean isPdf = "application/pdf".equals(file.getContentType())
                || (namaFile != null && namaFile.toLowerCase().endsWith(".pdf"));
        if (!isPdf) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Berkas wajib berformat PDF");
        }
        long maxSize = 10L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ukuran berkas maksimal 10MB");
        }
    }

    /** Dipakai bersama KepalaSpiDokumenController supaya Kepala SPI juga bisa melihat berkas yang sama. */
    public static ResponseEntity<byte[]> buildFileResponse(RegulasiTemplate dokumen) {
        if (dokumen.getFileBuktiData() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Dokumen ini belum punya berkas PDF");
        }
        String namaFile = StringUtils.hasText(dokumen.getFileBuktiNama())
                ? dokumen.getFileBuktiNama().replace("\"", "")
                : "dokumen-" + dokumen.getRegulasiId() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + namaFile + "\"")
                .body(dokumen.getFileBuktiData());
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        User current = currentUser(jwt);
        boolean isKoordinator = current.getRole() != null
                && ROLE_DUKUNGAN_AUDIT_KOORDINATOR.equals(current.getRole().getNamaRole());
        if (!isKoordinator) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Hanya Dukungan Audit (koordinator) yang bisa mengajukan dokumen ke Kepala SPI");
        }

        RegulasiTemplate dokumen = findDokumen(id);
        if (!STATUS_DRAFT.equals(dokumen.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Dokumen hanya bisa diajukan dari status Draft");
        }
        dokumen.setStatus(STATUS_DIAJUKAN);
        regulasiTemplateRepository.save(dokumen);

        return ResponseEntity.ok().build();
    }

    private RegulasiTemplate findDokumen(Integer id) {
        return regulasiTemplateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dokumen tidak ditemukan"));
    }

    /** Menyusun draf dokumen & unggah/ganti/hapus berkasnya hanya boleh "Dukungan Audit Staff". */
    private void requireStaff(Jwt jwt) {
        User current = currentUser(jwt);
        boolean isStaff = current.getRole() != null
                && ROLE_DUKUNGAN_AUDIT_STAFF.equals(current.getRole().getNamaRole());
        if (!isStaff) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Hanya Dukungan Audit Staff yang bisa menyusun/mengubah draf dokumen");
        }
    }

    private DokumenProgramResponse toResponse(RegulasiTemplate r) {
        return DokumenProgramResponse.builder()
                .regulasiId(r.getRegulasiId())
                .judul(r.getJudul())
                .kategori(r.getKategori())
                .fileUrl(r.getFileUrl())
                .fileBuktiNama(r.getFileBuktiNama())
                .fileBuktiUkuran(r.getFileBuktiUkuran())
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
