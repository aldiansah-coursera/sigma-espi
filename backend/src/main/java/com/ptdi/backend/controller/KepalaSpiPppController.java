package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CatatanRevisiRequest;
import com.ptdi.backend.dto.PppResponse;
import com.ptdi.backend.entity.PenugasanPpp;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.service.PppService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tahap 07 flowmap SIGMA v3.0 -- Kepala SPI (Penanggung Jawab)
 * "Persetujuan Penugasan (PPP)?" atas usulan yang sudah diteruskan
 * Pengawas. Setelah disetujui, Dukungan Audit bisa membuat draf Surat
 * Tugas-nya (tahap 08).
 */
@RestController
@RequestMapping("/api/kepala-spi/ppp")
@RequiredArgsConstructor
public class KepalaSpiPppController {

    private final PenugasanPppRepository penugasanPppRepository;
    private final PppService pppService;

    @GetMapping
    public List<PppResponse> getAll() {
        return penugasanPppRepository.findAllByOrderByPppIdDesc().stream()
                .map(pppService::toResponse)
                .toList();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DITERUSKAN.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa disetujui setelah diteruskan Pengawas");
        }
        ppp.setStatus(PppService.STATUS_DISETUJUI);
        ppp.setDisetujuiKepalaSpi(pppService.currentUser(jwt));
        penugasanPppRepository.save(ppp);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/kembalikan")
    public ResponseEntity<Void> kembalikan(@PathVariable Integer id, @RequestBody(required = false) CatatanRevisiRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DITERUSKAN.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa dikembalikan dari status Diteruskan");
        }
        ppp.setStatus(PppService.STATUS_DRAFT);
        ppp.setDisetujuiKepalaSpi(pppService.currentUser(jwt));
        ppp.setCatatanRevisi(request != null && StringUtils.hasText(request.getCatatan())
                ? request.getCatatan().trim()
                : "Dikembalikan Kepala SPI untuk diperbaiki.");
        penugasanPppRepository.save(ppp);
        return ResponseEntity.ok().build();
    }
}
