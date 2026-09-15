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
 * Tahap 06 flowmap SIGMA v3.0 (sisi penyetuju) -- Pengawas (Ka. Departemen
 * Pengawasan) MENYETUJUI & MENERUSKAN usulan PPP dari Ketua Tim ke Kepala
 * SPI, atau mengembalikannya dengan catatan revisi.
 */
@RestController
@RequestMapping("/api/pengawas/ppp")
@RequiredArgsConstructor
public class PengawasPppController {

    private final PenugasanPppRepository penugasanPppRepository;
    private final PppService pppService;

    @GetMapping
    public List<PppResponse> getAll() {
        return penugasanPppRepository.findAllByOrderByPppIdDesc().stream()
                .map(pppService::toResponse)
                .toList();
    }

    @PostMapping("/{id}/teruskan")
    public ResponseEntity<Void> teruskan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DIAJUKAN.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa diteruskan dari status Diajukan");
        }
        ppp.setStatus(PppService.STATUS_DITERUSKAN);
        ppp.setDisetujuiPengawas(pppService.currentUser(jwt));
        penugasanPppRepository.save(ppp);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/kembalikan")
    public ResponseEntity<Void> kembalikan(@PathVariable Integer id, @RequestBody(required = false) CatatanRevisiRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DIAJUKAN.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa dikembalikan dari status Diajukan");
        }
        ppp.setStatus(PppService.STATUS_DRAFT);
        ppp.setDisetujuiPengawas(pppService.currentUser(jwt));
        ppp.setCatatanRevisi(request != null && StringUtils.hasText(request.getCatatan())
                ? request.getCatatan().trim()
                : "Dikembalikan Pengawas untuk diperbaiki.");
        penugasanPppRepository.save(ppp);
        return ResponseEntity.ok().build();
    }
}
