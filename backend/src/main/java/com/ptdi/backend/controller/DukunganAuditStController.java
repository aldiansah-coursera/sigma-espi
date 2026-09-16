package com.ptdi.backend.controller;

import com.ptdi.backend.dto.PppResponse;
import com.ptdi.backend.dto.StaResponse;
import com.ptdi.backend.entity.PenugasanPpp;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.service.PppService;
import com.ptdi.backend.service.StaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tahap 08 & 10 flowmap SIGMA v3.0 -- Dukungan Audit (role tunggal) membuat
 * & mengajukan draf Surat Tugas (ST), lalu mendistribusikannya sendiri
 * setelah ditandatangani Kepala SPI. Isi ST diambil dari PPP yang sudah
 * disetujui Kepala SPI (tahap 07), jadi tidak diketik ulang.
 * Penandatanganannya di Kepala SPI (tahap 09, lihat KepalaSpiStaController).
 */
@RestController
@RequestMapping("/api/dukungan-audit/st")
@RequiredArgsConstructor
public class DukunganAuditStController {

    private final PenugasanStaRepository penugasanStaRepository;
    private final PenugasanPppRepository penugasanPppRepository;
    private final PppService pppService;
    private final StaService staService;

    @GetMapping
    public List<StaResponse> getAll() {
        return penugasanStaRepository.findAllByOrderByPenugasanIdDesc().stream()
                .map(staService::toResponse)
                .toList();
    }

    /** PPP yang sudah disetujui Kepala SPI dan belum dibuatkan Surat Tugas. */
    @GetMapping("/ppp-options")
    public List<PppResponse> getPppOptions() {
        Set<Integer> pppTerpakai = penugasanStaRepository.findAll().stream()
                .filter(s -> s.getPpp() != null)
                .map(s -> s.getPpp().getPppId())
                .collect(Collectors.toSet());

        return penugasanPppRepository.findAllByOrderByPppIdDesc().stream()
                .filter(p -> PppService.STATUS_DISETUJUI.equals(p.getStatus()))
                .filter(p -> !pppTerpakai.contains(p.getPppId()))
                .map(pppService::toResponse)
                .toList();
    }

    @PostMapping("/dari-ppp/{pppId}")
    public ResponseEntity<Void> createDariPpp(@PathVariable Integer pppId, @AuthenticationPrincipal Jwt jwt) {
        PenugasanPpp ppp = penugasanPppRepository.findById(pppId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PPP tidak ditemukan"));
        if (!PppService.STATUS_DISETUJUI.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Surat Tugas hanya bisa dibuat dari PPP yang sudah disetujui Kepala SPI");
        }
        boolean sudahAda = penugasanStaRepository.findAll().stream()
                .anyMatch(s -> s.getPpp() != null && s.getPpp().getPppId().equals(pppId));
        if (sudahAda) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP ini sudah punya Surat Tugas");
        }
        if (ppp.getDiusulkanOleh() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP ini tidak punya pengusul (Ketua Tim) yang valid");
        }

        PenugasanSta sta = PenugasanSta.builder()
                .objek(ppp.getObjek())
                .ppp(ppp)
                .nomorSta(generateNomorSta())
                .tanggalTerbit(LocalDate.now())
                .tanggalMulai(ppp.getTanggalMulai())
                .tanggalSelesai(ppp.getTanggalSelesai())
                .ruangLingkup(ppp.getRuangLingkup())
                .targetAudit(ppp.getSasaranAudit())
                .ketuaTim(ppp.getDiusulkanOleh())
                .dibuatOleh(staService.currentUser(jwt))
                .statusApproval(StaService.STATUS_DRAFT)
                .build();
        penugasanStaRepository.save(sta);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id) {
        PenugasanSta sta = staService.findOrThrow(id);
        if (!StaService.STATUS_DRAFT.equals(sta.getStatusApproval())) {
            throw new ApiException(HttpStatus.CONFLICT, "Surat Tugas hanya bisa diajukan dari status Draft");
        }
        sta.setStatusApproval(StaService.STATUS_DIAJUKAN);
        sta.setCatatanRevisi(null);
        penugasanStaRepository.save(sta);
        return ResponseEntity.ok().build();
    }

    /** Tahap 10: distribusi ST ke pihak terkait setelah ditandatangani Kepala SPI. */
    @PostMapping("/{id}/distribusikan")
    public ResponseEntity<Void> distribusikan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        PenugasanSta sta = staService.findOrThrow(id);
        if (!StaService.STATUS_DITANDATANGANI.equals(sta.getStatusApproval())) {
            throw new ApiException(HttpStatus.CONFLICT, "Surat Tugas hanya bisa didistribusikan setelah ditandatangani Kepala SPI");
        }
        sta.setStatusApproval(StaService.STATUS_DIDISTRIBUSIKAN);
        sta.setDidistribusikanOleh(staService.currentUser(jwt));
        sta.setTanggalDistribusi(LocalDate.now());
        penugasanStaRepository.save(sta);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        PenugasanSta sta = staService.findOrThrow(id);
        if (!StaService.STATUS_DRAFT.equals(sta.getStatusApproval())) {
            throw new ApiException(HttpStatus.CONFLICT, "Hanya draf Surat Tugas yang bisa dihapus");
        }
        penugasanStaRepository.delete(sta);
        return ResponseEntity.ok().build();
    }

    private String generateNomorSta() {
        long urutan = penugasanStaRepository.count() + 1;
        return String.format("ST/SPI/%d/%03d", LocalDate.now().getYear(), urutan);
    }
}
