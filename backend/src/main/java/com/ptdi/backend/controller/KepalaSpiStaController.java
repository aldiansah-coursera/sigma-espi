package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreateStaRequest;
import com.ptdi.backend.dto.ObjekPengawasanResponse;
import com.ptdi.backend.dto.StaResponse;
import com.ptdi.backend.dto.UserOption;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.entity.Pkpt;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.ObjekPengawasanRepository;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Kepala SPI menerbitkan Surat Tugas Audit (STA) dan mengalokasikan Ketua
 * Tim ke sebuah Objek Pengawasan — sesuai lane Kepala SPI di
 * Flowmap-SIGMA-v2.0 ("Mengelola Manajemen Penugasan" + "Menerbitkan Surat
 * Tugas Audit (ST)"). Nomor STA di-generate otomatis di server.
 */
@RestController
@RequestMapping("/api/kepala-spi/sta")
@RequiredArgsConstructor
public class KepalaSpiStaController {

    private static final String STATUS_APPROVED = "Approved";
    private static final String ROLE_KETUA_TIM = "Ketua Tim";
    private static final String STATUS_AKTIF = "Aktif";

    private final PenugasanStaRepository penugasanStaRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<StaResponse> getAll() {
        return penugasanStaRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getPenugasanId(), a.getPenugasanId()))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Objek pengawasan yang boleh dipilih untuk STA baru: PKPT-nya sudah
     * di-approve Kepala SPI, dan belum pernah dipakai oleh STA lain.
     */
    @GetMapping("/objek-options")
    public List<ObjekPengawasanResponse> getObjekOptions() {
        Set<Integer> objekTerpakai = penugasanStaRepository.findAll().stream()
                .filter(p -> p.getObjek() != null)
                .map(p -> p.getObjek().getObjekId())
                .collect(Collectors.toSet());

        return objekPengawasanRepository.findAll().stream()
                .filter(o -> o.getPkpt() != null && STATUS_APPROVED.equals(o.getPkpt().getStatus()))
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

    @GetMapping("/ketua-tim-options")
    public List<UserOption> getKetuaTimOptions() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && ROLE_KETUA_TIM.equals(u.getRole().getNamaRole()))
                .filter(u -> STATUS_AKTIF.equals(u.getStatus()))
                .map(u -> UserOption.builder().id(u.getUserId()).nama(u.getNama()).build())
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreateStaRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (request.getObjekId() == null || request.getKetuaTimUserId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Objek audit dan ketua tim wajib dipilih");
        }

        ObjekPengawasan objek = objekPengawasanRepository.findById(request.getObjekId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Objek pengawasan tidak ditemukan"));
        User ketuaTim = userRepository.findById(request.getKetuaTimUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Ketua tim tidak ditemukan"));
        User current = currentUser(jwt);

        PenugasanSta sta = PenugasanSta.builder()
                .objek(objek)
                .nomorSta(generateNomorSta())
                .tanggalTerbit(LocalDate.now())
                .ketuaTim(ketuaTim)
                .diterbitkanOleh(current)
                .statusApproval("Active")
                .build();
        penugasanStaRepository.save(sta);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private String generateNomorSta() {
        long urutan = penugasanStaRepository.count() + 1;
        return String.format("STA/SPI/%d/%03d", LocalDate.now().getYear(), urutan);
    }

    private StaResponse toResponse(PenugasanSta sta) {
        ObjekPengawasan objek = sta.getObjek();
        Pkpt pkpt = objek != null ? objek.getPkpt() : null;
        return StaResponse.builder()
                .penugasanId(sta.getPenugasanId())
                .nomorSta(sta.getNomorSta())
                .tanggalTerbit(sta.getTanggalTerbit() != null ? sta.getTanggalTerbit().toString() : null)
                .objekAudit(objek != null ? objek.getJenisPengawasan() : null)
                .unitKerja(objek != null && objek.getUnit() != null ? objek.getUnit().getNamaUnit() : null)
                .periode(pkpt != null && pkpt.getTahunAnggaran() != null ? pkpt.getTahunAnggaran().toString() : null)
                .ketuaTim(sta.getKetuaTim() != null ? sta.getKetuaTim().getNama() : null)
                .diterbitkanOleh(sta.getDiterbitkanOleh() != null ? sta.getDiterbitkanOleh().getNama() : null)
                .statusApproval(sta.getStatusApproval())
                .build();
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
