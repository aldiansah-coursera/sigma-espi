package com.ptdi.backend.controller;

import com.ptdi.backend.dto.CreatePkptRequest;
import com.ptdi.backend.dto.ObjekPengawasanInput;
import com.ptdi.backend.dto.ObjekPengawasanResponse;
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

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Tahap 05 flowmap SIGMA v3.0 -- Dukungan Audit "Menyediakan & Mengelola
 * Data PKPT (Rencana Tahunan)". Pembagian kerjanya sesuai arahan klien:
 * Dukungan Audit MENYUSUN DRAF dan MENERBITKAN, Kepala SPI yang
 * memeriksa (Checked) lalu mengesahkan (Approved) -- lihat
 * KepalaSpiPkptController.
 *
 * Status: Draft -> Diajukan -> Checked -> Approved -> Diterbitkan.
 * Kalau Kepala SPI mengembalikan, status balik ke Draft + catatan revisi.
 */
@RestController
@RequestMapping("/api/dukungan-audit/pkpt")
@RequiredArgsConstructor
public class DukunganAuditPkptController {

    public static final String STATUS_DRAFT = "Draft";
    public static final String STATUS_DIAJUKAN = "Diajukan";
    public static final String STATUS_CHECKED = "Checked";
    public static final String STATUS_APPROVED = "Approved";
    public static final String STATUS_DITERBITKAN = "Diterbitkan";
    private static final String ROLE_DUKUNGAN_AUDIT_KOORDINATOR = "Dukungan Audit";

    private final PkptRepository pkptRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<PkptResponse> getAll() {
        List<ObjekPengawasan> allObjek = objekPengawasanRepository.findAll();
        return pkptRepository.findAllByOrderByPkptIdDesc().stream()
                .map(p -> toResponse(p, allObjek))
                .toList();
    }

    /** Dropdown Unit Kerja untuk baris objek pengawasan pada form draf. */
    @GetMapping("/unit-options")
    public List<String> getUnitOptions() {
        return unitRepository.findAll().stream()
                .map(Unit::getNamaUnit)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CreatePkptRequest request, @AuthenticationPrincipal Jwt jwt) {
        validate(request);

        Pkpt pkpt = Pkpt.builder()
                .tahunAnggaran(request.getTahunAnggaran())
                .namaPkpt(request.getNamaPkpt().trim())
                .tanggalMulai(request.getTanggalMulai())
                .tanggalSelesai(request.getTanggalSelesai())
                .status(STATUS_DRAFT)
                .dibuatOleh(currentUser(jwt))
                .build();
        pkpt = pkptRepository.save(pkpt);

        simpanObjek(pkpt, request.getObjekPengawasan());

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** Ubah isi draf selama statusnya masih Draft (termasuk setelah dikembalikan Kepala SPI). */
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Integer id, @RequestBody CreatePkptRequest request) {
        validate(request);
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DRAFT.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT hanya bisa diubah selama berstatus Draft");
        }

        pkpt.setTahunAnggaran(request.getTahunAnggaran());
        pkpt.setNamaPkpt(request.getNamaPkpt().trim());
        pkpt.setTanggalMulai(request.getTanggalMulai());
        pkpt.setTanggalSelesai(request.getTanggalSelesai());
        pkptRepository.save(pkpt);

        // Objek pengawasan ditulis ulang supaya isinya persis seperti form.
        List<ObjekPengawasan> objekLama = objekPengawasanRepository.findAll().stream()
                .filter(o -> o.getPkpt() != null && pkpt.getPkptId().equals(o.getPkpt().getPkptId()))
                .toList();
        objekPengawasanRepository.deleteAll(objekLama);
        simpanObjek(pkpt, request.getObjekPengawasan());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        requireKoordinator(jwt);
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DRAFT.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT hanya bisa diajukan dari status Draft");
        }
        pkpt.setStatus(STATUS_DIAJUKAN);
        pkpt.setCatatanRevisi(null);
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    /** Tahap akhir 05: setelah disahkan Kepala SPI, Dukungan Audit yang menerbitkan. */
    @PostMapping("/{id}/terbitkan")
    public ResponseEntity<Void> terbitkan(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        requireKoordinator(jwt);
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_APPROVED.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "PKPT hanya bisa diterbitkan setelah disahkan Kepala SPI");
        }
        pkpt.setStatus(STATUS_DITERBITKAN);
        pkpt.setDiterbitkanOleh(currentUser(jwt));
        pkpt.setTanggalTerbit(LocalDate.now());
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DRAFT.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Hanya draf yang bisa dihapus");
        }
        List<ObjekPengawasan> objekLama = objekPengawasanRepository.findAll().stream()
                .filter(o -> o.getPkpt() != null && pkpt.getPkptId().equals(o.getPkpt().getPkptId()))
                .toList();
        objekPengawasanRepository.deleteAll(objekLama);
        pkptRepository.delete(pkpt);
        return ResponseEntity.ok().build();
    }

    private void validate(CreatePkptRequest request) {
        if (request == null
                || request.getTahunAnggaran() == null
                || !StringUtils.hasText(request.getNamaPkpt())
                || request.getTanggalMulai() == null
                || request.getTanggalSelesai() == null
                || request.getObjekPengawasan() == null
                || request.getObjekPengawasan().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tahun anggaran, nama PKPT, periode, dan minimal 1 objek pengawasan wajib diisi");
        }
        if (request.getTanggalSelesai().isBefore(request.getTanggalMulai())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tanggal selesai tidak boleh sebelum tanggal mulai");
        }
    }

    private void simpanObjek(Pkpt pkpt, List<ObjekPengawasanInput> inputs) {
        for (ObjekPengawasanInput input : inputs) {
            if (!StringUtils.hasText(input.getUnitKerja()) || !StringUtils.hasText(input.getJenisPengawasan())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja dan jenis pengawasan wajib diisi tiap objek");
            }
            Unit unit = unitRepository.findAll().stream()
                    .filter(u -> u.getNamaUnit().equalsIgnoreCase(input.getUnitKerja()))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja tidak dikenali"));
            objekPengawasanRepository.save(ObjekPengawasan.builder()
                    .pkpt(pkpt)
                    .unit(unit)
                    .jenisPengawasan(input.getJenisPengawasan().trim())
                    .prioritasRisiko(StringUtils.hasText(input.getPrioritasRisiko()) ? input.getPrioritasRisiko() : "Sedang")
                    .status("Terjadwal")
                    .build());
        }
    }

    private Pkpt findOrThrow(Integer id) {
        return pkptRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PKPT tidak ditemukan"));
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }

    /**
     * Hanya "Dukungan Audit" (koordinator) yang boleh mengajukan PKPT ke
     * Kepala SPI dan menerbitkan PKPT yang sudah disahkan -- staf
     * ("Dukungan Audit Staff") hanya boleh menyusun/mengubah/menghapus draf.
     */
    private void requireKoordinator(Jwt jwt) {
        User current = currentUser(jwt);
        boolean isKoordinator = current.getRole() != null
                && ROLE_DUKUNGAN_AUDIT_KOORDINATOR.equals(current.getRole().getNamaRole());
        if (!isKoordinator) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Hanya Dukungan Audit (koordinator) yang bisa mengajukan/menerbitkan PKPT");
        }
    }

    /**
     * Dipakai bersama KepalaSpiPkptController supaya bentuk respons PKPT
     * persis sama di kedua sisi (Dukungan Audit & Kepala SPI).
     */
    public static PkptResponse buildResponse(Pkpt pkpt, List<ObjekPengawasan> allObjek) {
        List<ObjekPengawasan> milikPkpt = allObjek.stream()
                .filter(o -> o.getPkpt() != null && pkpt.getPkptId().equals(o.getPkpt().getPkptId()))
                .toList();
        return PkptResponse.builder()
                .pkptId(pkpt.getPkptId())
                .tahunAnggaran(pkpt.getTahunAnggaran())
                .namaPkpt(pkpt.getNamaPkpt())
                .tanggalMulai(pkpt.getTanggalMulai() != null ? pkpt.getTanggalMulai().toString() : null)
                .tanggalSelesai(pkpt.getTanggalSelesai() != null ? pkpt.getTanggalSelesai().toString() : null)
                .status(pkpt.getStatus())
                .dibuatOleh(pkpt.getDibuatOleh() != null ? pkpt.getDibuatOleh().getNama() : null)
                .disahkanOleh(pkpt.getDisahkanOleh() != null ? pkpt.getDisahkanOleh().getNama() : null)
                .diterbitkanOleh(pkpt.getDiterbitkanOleh() != null ? pkpt.getDiterbitkanOleh().getNama() : null)
                .tanggalTerbit(pkpt.getTanggalTerbit() != null ? pkpt.getTanggalTerbit().toString() : null)
                .catatanRevisi(pkpt.getCatatanRevisi())
                .totalObjek(milikPkpt.size())
                .objekPengawasan(milikPkpt.stream()
                        .map(o -> ObjekPengawasanResponse.builder()
                                .objekId(o.getObjekId())
                                .namaPkpt(pkpt.getNamaPkpt())
                                .unitKerja(o.getUnit() != null ? o.getUnit().getNamaUnit() : null)
                                .jenisPengawasan(o.getJenisPengawasan())
                                .prioritasRisiko(o.getPrioritasRisiko())
                                .status(o.getStatus())
                                .build())
                        .toList())
                .build();
    }

    private PkptResponse toResponse(Pkpt pkpt, List<ObjekPengawasan> allObjek) {
        return buildResponse(pkpt, allObjek);
    }
}
