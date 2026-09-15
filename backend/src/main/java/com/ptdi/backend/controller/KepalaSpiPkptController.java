package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CatatanRevisiRequest;
import com.ptdi.backend.dto.PkptResponse;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.Pkpt;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.ObjekPengawasanRepository;
import com.ptdi.backend.repository.PkptRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tahap 06 flowmap SIGMA v3.0 -- Kepala SPI "Memeriksa & Mengesahkan PKPT".
 * Sesuai arahan klien, Kepala SPI TIDAK lagi menyusun PKPT sendiri: drafnya
 * dibuat Dukungan Audit (DukunganAuditPkptController), di sini hanya
 * diperiksa (Checked) lalu disahkan (Approved), atau dikembalikan ke Draft
 * dengan catatan revisi. Penerbitannya kembali ke Dukungan Audit.
 */
@RestController
@RequestMapping("/api/kepala-spi/pkpt")
@RequiredArgsConstructor
public class KepalaSpiPkptController {

    // Data lama (sebelum alur v3.0) berstatus "Pending" -- tetap dianggap
    // setara "Diajukan" supaya PKPT lama masih bisa diproses Kepala SPI.
    private static final String STATUS_PENDING_LAMA = "Pending";

    private final PkptRepository pkptRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<PkptResponse> getAll() {
        List<ObjekPengawasan> allObjek = objekPengawasanRepository.findAll();
        return pkptRepository.findAllByOrderByPkptIdDesc().stream()
                .map(p -> DukunganAuditPkptController.buildResponse(p, allObjek))
                .toList();
    }

    /** Kepala SPI juga perlu melihat berkas PDF pendukung saat memeriksa/mengesahkan PKPT. */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Integer id) {
        return DukunganAuditPkptController.buildFileResponse(findOrThrow(id));
    }

    @PostMapping("/{id}/check")
    public ResponseEntity<Void> check(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        Pkpt pkpt = findOrThrow(id);
        if (!isSiapDiperiksa(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT hanya bisa diperiksa dari status Diajukan");
        }
        pkpt.setStatus(DukunganAuditPkptController.STATUS_CHECKED);
        pkpt.setDisahkanOleh(currentUser(jwt));
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        Pkpt pkpt = findOrThrow(id);
        if (!DukunganAuditPkptController.STATUS_CHECKED.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT hanya bisa disahkan setelah diperiksa (status Checked)");
        }
        pkpt.setStatus(DukunganAuditPkptController.STATUS_APPROVED);
        pkpt.setDisahkanOleh(currentUser(jwt));
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    /** Kembalikan draf ke Dukungan Audit dengan catatan revisi. */
    @PostMapping("/{id}/kembalikan")
    public ResponseEntity<Void> kembalikan(@PathVariable Integer id, @RequestBody(required = false) CatatanRevisiRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        Pkpt pkpt = findOrThrow(id);
        if (!isSiapDiperiksa(pkpt.getStatus()) && !DukunganAuditPkptController.STATUS_CHECKED.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT yang sudah disahkan tidak bisa dikembalikan");
        }
        pkpt.setStatus(DukunganAuditPkptController.STATUS_DRAFT);
        pkpt.setDisahkanOleh(currentUser(jwt));
        pkpt.setCatatanRevisi(request != null && StringUtils.hasText(request.getCatatan())
                ? request.getCatatan().trim()
                : "Dikembalikan Kepala SPI untuk diperbaiki.");
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    private boolean isSiapDiperiksa(String status) {
        return DukunganAuditPkptController.STATUS_DIAJUKAN.equals(status) || STATUS_PENDING_LAMA.equals(status);
    }

    private Pkpt findOrThrow(Integer id) {
        return pkptRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PKPT tidak ditemukan"));
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
