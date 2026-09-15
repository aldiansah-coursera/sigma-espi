package com.ptdi.backend.controller;

import com.ptdi.backend.dto.ObjekPengawasanResponse;
import com.ptdi.backend.dto.PppRequest;
import com.ptdi.backend.dto.PppResponse;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.PenugasanPpp;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.ObjekPengawasanRepository;
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.service.PppService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tahap 06 flowmap SIGMA v3.0 (sisi pengusul) -- Ketua Tim MENGUSULKAN
 * Program & Pengajuan Penugasan (PPP), lalu diajukan ke Pengawas untuk
 * disetujui & diteruskan ke Kepala SPI (lihat PengawasPppController).
 */
@RestController
@RequestMapping("/api/ketua-tim/ppp")
@RequiredArgsConstructor
public class KetuaTimPppController {

    // Objek pengawasan baru bisa diusulkan kalau PKPT-nya sudah disahkan.
    // Objek pengawasan baru dibuat staf SETELAH PKPT diterbitkan (lihat
    // DukunganAuditPkptController.tambahObjek()), jadi cukup filter status ini.
    private static final Set<String> STATUS_PKPT_SIAP = Set.of("Diterbitkan");

    private final PenugasanPppRepository penugasanPppRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final PppService pppService;

    @GetMapping
    public List<PppResponse> getAll() {
        return penugasanPppRepository.findAllByOrderByPppIdDesc().stream()
                .map(pppService::toResponse)
                .toList();
    }

    /** Objek dari PKPT yang sudah disahkan dan belum punya PPP. */
    @GetMapping("/objek-options")
    public List<ObjekPengawasanResponse> getObjekOptions() {
        Set<Integer> objekTerpakai = penugasanPppRepository.findAll().stream()
                .filter(p -> p.getObjek() != null)
                .map(p -> p.getObjek().getObjekId())
                .collect(Collectors.toSet());

        return objekPengawasanRepository.findAll().stream()
                .filter(o -> o.getPkpt() != null && STATUS_PKPT_SIAP.contains(o.getPkpt().getStatus()))
                .filter(o -> !objekTerpakai.contains(o.getObjekId()))
                .map(o -> ObjekPengawasanResponse.builder()
                        .objekId(o.getObjekId())
                        .namaPkpt(o.getPkpt().getNamaPkpt())
                        .unitKerja(o.getUnit() != null ? o.getUnit().getNamaUnit() : null)
                        .jenisPengawasan(o.getJenisPengawasan())
                        .prioritasRisiko(o.getPrioritasRisiko())
                        .status(o.getStatus())
                        .build())
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody PppRequest request, @AuthenticationPrincipal Jwt jwt) {
        validate(request);
        ObjekPengawasan objek = resolveObjek(request.getObjekId());

        PenugasanPpp ppp = PenugasanPpp.builder()
                .objek(objek)
                .ruangLingkup(request.getRuangLingkup().trim())
                .sasaranAudit(request.getSasaranAudit().trim())
                .komposisiTim(StringUtils.hasText(request.getKomposisiTim()) ? request.getKomposisiTim().trim() : null)
                .tanggalMulai(parseTanggal(request.getTanggalMulai()))
                .tanggalSelesai(parseTanggal(request.getTanggalSelesai()))
                .status(PppService.STATUS_DRAFT)
                .diusulkanOleh(pppService.currentUser(jwt))
                .createdAt(Instant.now())
                .build();
        penugasanPppRepository.save(ppp);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Integer id, @RequestBody PppRequest request) {
        validate(request);
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DRAFT.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa diubah selama berstatus Draft");
        }

        ppp.setObjek(resolveObjek(request.getObjekId()));
        ppp.setRuangLingkup(request.getRuangLingkup().trim());
        ppp.setSasaranAudit(request.getSasaranAudit().trim());
        ppp.setKomposisiTim(StringUtils.hasText(request.getKomposisiTim()) ? request.getKomposisiTim().trim() : null);
        ppp.setTanggalMulai(parseTanggal(request.getTanggalMulai()));
        ppp.setTanggalSelesai(parseTanggal(request.getTanggalSelesai()));
        penugasanPppRepository.save(ppp);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DRAFT.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PPP hanya bisa diajukan dari status Draft");
        }
        ppp.setStatus(PppService.STATUS_DIAJUKAN);
        ppp.setCatatanRevisi(null);
        penugasanPppRepository.save(ppp);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        PenugasanPpp ppp = pppService.findOrThrow(id);
        if (!PppService.STATUS_DRAFT.equals(ppp.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Hanya draf PPP yang bisa dihapus");
        }
        penugasanPppRepository.delete(ppp);
        return ResponseEntity.ok().build();
    }

    private void validate(PppRequest request) {
        if (request == null || request.getObjekId() == null
                || !StringUtils.hasText(request.getRuangLingkup())
                || !StringUtils.hasText(request.getSasaranAudit())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Objek pengawasan, ruang lingkup, dan sasaran audit wajib diisi");
        }
        LocalDate mulai = parseTanggal(request.getTanggalMulai());
        LocalDate selesai = parseTanggal(request.getTanggalSelesai());
        if (mulai == null || selesai == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Jangka waktu penugasan (mulai & selesai) wajib diisi");
        }
        if (selesai.isBefore(mulai)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tanggal selesai tidak boleh sebelum tanggal mulai");
        }
    }

    private ObjekPengawasan resolveObjek(Integer objekId) {
        ObjekPengawasan objek = objekPengawasanRepository.findById(objekId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Objek pengawasan tidak ditemukan"));
        if (objek.getPkpt() == null || !STATUS_PKPT_SIAP.contains(objek.getPkpt().getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Objek pengawasan ini PKPT-nya belum disahkan Kepala SPI");
        }
        return objek;
    }

    private LocalDate parseTanggal(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Format tanggal tidak valid");
        }
    }
}
