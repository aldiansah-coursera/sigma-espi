package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreatePkptRequest;
import com.ptdi.backend.dto.ObjekPengawasanInput;
import com.ptdi.backend.dto.PkptResponse;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.Pkpt;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.ObjekPengawasanRepository;
import com.ptdi.backend.repository.PkptRepository;
import com.ptdi.backend.repository.UnitRepository;
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
 * Kepala SPI membuat PKPT (Program Kerja Pengawasan Tahunan) langsung —
 * sesuai Flowmap-SIGMA-v2.0 ("Membuat PKPT" ada di lane Kepala SPI, bukan
 * lane lain yang mengajukan ke Kepala SPI). Approve/reject di sini adalah
 * langkah finalisasi Kepala SPI sendiri sebelum objek pengawasannya bisa
 * dipakai menerbitkan STA.
 */
@RestController
@RequestMapping("/api/kepala-spi/pkpt")
@RequiredArgsConstructor
public class KepalaSpiPkptController {

    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_APPROVED = "Approved";
    private static final String STATUS_DITOLAK = "Ditolak";

    private final PkptRepository pkptRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<PkptResponse> getAll() {
        List<ObjekPengawasan> allObjek = objekPengawasanRepository.findAll();
        return pkptRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getPkptId(), a.getPkptId()))
                .map(pkpt -> toResponse(pkpt, allObjek))
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreatePkptRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (request.getTahunAnggaran() == null
                || !StringUtils.hasText(request.getNamaPkpt())
                || request.getTanggalMulai() == null
                || request.getTanggalSelesai() == null
                || request.getObjekPengawasan() == null
                || request.getObjekPengawasan().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tahun anggaran, nama PKPT, periode, dan minimal 1 objek pengawasan wajib diisi");
        }

        User current = currentUser(jwt);

        Pkpt pkpt = Pkpt.builder()
                .tahunAnggaran(request.getTahunAnggaran())
                .namaPkpt(request.getNamaPkpt().trim())
                .tanggalMulai(request.getTanggalMulai())
                .tanggalSelesai(request.getTanggalSelesai())
                .status(STATUS_PENDING)
                .dibuatOleh(current)
                .build();
        pkpt = pkptRepository.save(pkpt);

        for (ObjekPengawasanInput input : request.getObjekPengawasan()) {
            if (!StringUtils.hasText(input.getUnitKerja()) || !StringUtils.hasText(input.getJenisPengawasan())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja dan jenis pengawasan wajib diisi tiap objek");
            }
            Unit unit = resolveUnitOrThrow(input.getUnitKerja());
            ObjekPengawasan objek = ObjekPengawasan.builder()
                    .pkpt(pkpt)
                    .unit(unit)
                    .jenisPengawasan(input.getJenisPengawasan().trim())
                    .prioritasRisiko(StringUtils.hasText(input.getPrioritasRisiko()) ? input.getPrioritasRisiko() : "Sedang")
                    .status("Terjadwal")
                    .build();
            objekPengawasanRepository.save(objek);
        }

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Integer id) {
        Pkpt pkpt = findOrThrow(id);
        pkpt.setStatus(STATUS_APPROVED);
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Integer id) {
        Pkpt pkpt = findOrThrow(id);
        pkpt.setStatus(STATUS_DITOLAK);
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    private PkptResponse toResponse(Pkpt pkpt, List<ObjekPengawasan> allObjek) {
        long totalObjek = allObjek.stream()
                .filter(o -> o.getPkpt() != null && pkpt.getPkptId().equals(o.getPkpt().getPkptId()))
                .count();
        return PkptResponse.builder()
                .pkptId(pkpt.getPkptId())
                .tahunAnggaran(pkpt.getTahunAnggaran())
                .namaPkpt(pkpt.getNamaPkpt())
                .tanggalMulai(pkpt.getTanggalMulai() != null ? pkpt.getTanggalMulai().toString() : null)
                .tanggalSelesai(pkpt.getTanggalSelesai() != null ? pkpt.getTanggalSelesai().toString() : null)
                .status(pkpt.getStatus())
                .dibuatOleh(pkpt.getDibuatOleh() != null ? pkpt.getDibuatOleh().getNama() : null)
                .totalObjek((int) totalObjek)
                .build();
    }

    private Unit resolveUnitOrThrow(String unitKerja) {
        return unitRepository.findAll().stream()
                .filter(u -> u.getNamaUnit().equalsIgnoreCase(unitKerja))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja tidak dikenali"));
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
