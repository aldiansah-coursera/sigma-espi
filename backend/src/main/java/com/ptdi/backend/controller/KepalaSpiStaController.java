package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CatatanRevisiRequest;
import com.ptdi.backend.dto.StaResponse;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.service.StaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Tahap 09 flowmap SIGMA v3.0 -- Kepala SPI (Penanggung Jawab)
 * "Menandatangani Surat Tugas (ST) & PPP". Sesuai dokumen resmi
 * 83-AP-003A, Kepala SPI TIDAK lagi membuat ST sendiri: drafnya dibuat
 * Dukungan Audit dari PPP yang sudah disetujui (tahap 08), dan
 * distribusinya kembali ke Dukungan Audit (tahap 10).
 */
@RestController
@RequestMapping("/api/kepala-spi/sta")
@RequiredArgsConstructor
public class KepalaSpiStaController {

    private final PenugasanStaRepository penugasanStaRepository;
    private final StaService staService;

    @GetMapping
    public List<StaResponse> getAll() {
        return penugasanStaRepository.findAllByOrderByPenugasanIdDesc().stream()
                .map(staService::toResponse)
                .toList();
    }

    @PostMapping("/{id}/tanda-tangan")
    public ResponseEntity<Void> tandaTangan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        PenugasanSta sta = staService.findOrThrow(id);
        if (!StaService.STATUS_DIAJUKAN.equals(sta.getStatusApproval())) {
            throw new ApiException(HttpStatus.CONFLICT, "Surat Tugas hanya bisa ditandatangani dari status Diajukan");
        }
        sta.setStatusApproval(StaService.STATUS_DITANDATANGANI);
        sta.setDiterbitkanOleh(staService.currentUser(jwt));
        sta.setTanggalTerbit(LocalDate.now());
        penugasanStaRepository.save(sta);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/kembalikan")
    public ResponseEntity<Void> kembalikan(@PathVariable Integer id, @RequestBody(required = false) CatatanRevisiRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        PenugasanSta sta = staService.findOrThrow(id);
        if (!StaService.STATUS_DIAJUKAN.equals(sta.getStatusApproval())) {
            throw new ApiException(HttpStatus.CONFLICT, "Surat Tugas hanya bisa dikembalikan dari status Diajukan");
        }
        sta.setStatusApproval(StaService.STATUS_DRAFT);
        sta.setDiterbitkanOleh(staService.currentUser(jwt));
        sta.setCatatanRevisi(request != null && StringUtils.hasText(request.getCatatan())
                ? request.getCatatan().trim()
                : "Dikembalikan Kepala SPI untuk diperbaiki.");
        penugasanStaRepository.save(sta);
        return ResponseEntity.ok().build();
    }
}
