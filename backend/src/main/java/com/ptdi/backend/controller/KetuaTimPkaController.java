package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreatePkaRequest;
import com.ptdi.backend.dto.PenugasanOption;
import com.ptdi.backend.dto.PkaResponse;
import com.ptdi.backend.dto.UpdatePkaRequest;
import com.ptdi.backend.entity.Pka;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.repository.PkaRepository;
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
 * Ketua Tim mengajukan & mengelola Program Kerja Audit (PKA) -- daftar
 * langkah kerja/prosedur audit di bawah satu Surat Tugas Audit (STA) yang
 * penugasannya (PenugasanSta.ketuaTim) adalah dirinya sendiri.
 *
 * Setiap PKA baru otomatis berstatus "In Review" (menunggu direview lebih
 * lanjut); mengedit PKA yang sudah pernah direspons mengembalikannya ke
 * "In Review" lagi karena isinya berubah.
 */
@RestController
@RequestMapping("/api/ketua-tim/pka")
@RequiredArgsConstructor
public class KetuaTimPkaController {

    private static final String STATUS_IN_REVIEW = "In Review";

    private final PkaRepository pkaRepository;
    private final PenugasanStaRepository penugasanStaRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<PkaResponse> getAll(@AuthenticationPrincipal Jwt jwt) {
        User current = currentUser(jwt);
        return pkaRepository.findAll().stream()
                .filter(pka -> belongsToKetuaTim(pka.getPenugasan(), current))
                .sorted((a, b) -> Integer.compare(b.getPkaId(), a.getPkaId()))
                .map(this::toResponse)
                .toList();
    }

    /**
     * STA yang boleh dipilih saat membuat PKA baru: STA yang ketua timnya
     * adalah pengguna yang sedang login.
     */
    @GetMapping("/penugasan-options")
    public List<PenugasanOption> getPenugasanOptions(@AuthenticationPrincipal Jwt jwt) {
        User current = currentUser(jwt);
        return penugasanStaRepository.findAll().stream()
                .filter(sta -> sta.getKetuaTim() != null && sta.getKetuaTim().getUserId().equals(current.getUserId()))
                .sorted((a, b) -> Integer.compare(b.getPenugasanId(), a.getPenugasanId()))
                .map(sta -> PenugasanOption.builder()
                        .penugasanId(sta.getPenugasanId())
                        .nomorSta(sta.getNomorSta())
                        .objekAudit(sta.getObjek() != null ? sta.getObjek().getJenisPengawasan() : null)
                        .build())
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreatePkaRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (request.getPenugasanId() == null
                || !StringUtils.hasText(request.getLangkahKerja())
                || !StringUtils.hasText(request.getAlokasiWaktu())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "STA, langkah kerja, dan alokasi waktu wajib diisi");
        }

        User current = currentUser(jwt);
        PenugasanSta penugasan = penugasanStaRepository.findById(request.getPenugasanId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "STA tidak ditemukan"));
        if (!belongsToKetuaTim(penugasan, current)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "STA ini bukan penugasan Anda");
        }

        Pka pka = Pka.builder()
                .penugasan(penugasan)
                .langkahKerja(request.getLangkahKerja().trim())
                .alokasiWaktu(request.getAlokasiWaktu().trim())
                .statusPersetujuan(STATUS_IN_REVIEW)
                .build();
        pkaRepository.save(pka);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Integer id, @RequestBody UpdatePkaRequest request,
                                        @AuthenticationPrincipal Jwt jwt) {
        if (!StringUtils.hasText(request.getLangkahKerja()) || !StringUtils.hasText(request.getAlokasiWaktu())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Langkah kerja dan alokasi waktu wajib diisi");
        }

        User current = currentUser(jwt);
        Pka pka = pkaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PKA tidak ditemukan"));
        if (!belongsToKetuaTim(pka.getPenugasan(), current)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PKA ini bukan milik Anda");
        }

        pka.setLangkahKerja(request.getLangkahKerja().trim());
        pka.setAlokasiWaktu(request.getAlokasiWaktu().trim());
        pka.setStatusPersetujuan(STATUS_IN_REVIEW);
        pkaRepository.save(pka);

        return ResponseEntity.ok().build();
    }

    private boolean belongsToKetuaTim(PenugasanSta penugasan, User current) {
        return penugasan != null && penugasan.getKetuaTim() != null
                && penugasan.getKetuaTim().getUserId().equals(current.getUserId());
    }

    private PkaResponse toResponse(Pka pka) {
        PenugasanSta penugasan = pka.getPenugasan();
        return PkaResponse.builder()
                .pkaId(pka.getPkaId())
                .penugasanId(penugasan != null ? penugasan.getPenugasanId() : null)
                .nomorSta(penugasan != null ? penugasan.getNomorSta() : null)
                .objekAudit(penugasan != null && penugasan.getObjek() != null
                        ? penugasan.getObjek().getJenisPengawasan() : null)
                .langkahKerja(pka.getLangkahKerja())
                .alokasiWaktu(pka.getAlokasiWaktu())
                .statusPersetujuan(pka.getStatusPersetujuan())
                .disetujuiOleh(pka.getDisetujuiOleh() != null ? pka.getDisetujuiOleh().getNama() : null)
                .build();
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
