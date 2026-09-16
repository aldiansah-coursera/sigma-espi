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
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.repository.PkptRepository;
import com.ptdi.backend.repository.UnitRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Tahap 05 flowmap SIGMA v3.0 -- Dukungan Audit "Menyediakan & Mengelola
 * Data PKPT (Rencana Tahunan)". Role "Dukungan Audit" dan "Dukungan Audit
 * Staff" sudah DIGABUNG jadi satu role (atas permintaan pengguna) -- tidak
 * ada lagi gerbang internal staf vs koordinator, siapa pun dengan role ini
 * bebas menyusun draf, mengajukan, dan menerbitkan sendiri. Kepala SPI yang
 * memeriksa (Checked) lalu mengesahkan (Approved) -- lihat
 * KepalaSpiPkptController.
 *
 * Status: Draft -> Diajukan -> Checked -> Approved -> Diterbitkan.
 * Kalau Kepala SPI mengembalikan, status balik ke Draft + catatan revisi.
 *
 * Objek pengawasan TIDAK lagi diisi saat menyusun draf -- baru dilengkapi
 * setelah PKPT berstatus Diterbitkan, sebagai bahan Ketua Tim mengusulkan
 * PPP (lihat endpoint .../objek di bawah).
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


    private final PkptRepository pkptRepository;
    private final ObjekPengawasanRepository objekPengawasanRepository;
    private final PenugasanPppRepository penugasanPppRepository;
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
    public ResponseEntity<Map<String, Integer>> create(@RequestBody CreatePkptRequest request, @AuthenticationPrincipal Jwt jwt) {
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

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("pkptId", pkpt.getPkptId()));
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

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ajukan")
    public ResponseEntity<Void> ajukan(@PathVariable Integer id) {
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

    /**
     * Unggah (atau ganti) berkas PDF pendukung draf PKPT -- hanya diizinkan
     * selama status masih Draft.
     */
    @PostMapping("/{id}/file")
    public ResponseEntity<Void> uploadFile(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DRAFT.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Berkas hanya bisa diunggah/diganti selama PKPT berstatus Draft");
        }
        validateFile(file);
        try {
            pkpt.setFileBuktiData(file.getBytes());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gagal membaca berkas yang diunggah");
        }
        pkpt.setFileBuktiNama(file.getOriginalFilename());
        pkpt.setFileBuktiUkuran(file.getSize());
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    /** Berkas PDF bisa dilihat/diunduh siapa saja yang punya akses ke PKPT ini (Dukungan Audit, staf, & Kepala SPI). */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Integer id) {
        return buildFileResponse(findOrThrow(id));
    }

    @DeleteMapping("/{id}/file")
    public ResponseEntity<Void> deleteFile(@PathVariable Integer id) {
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DRAFT.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Berkas hanya bisa dihapus selama PKPT berstatus Draft");
        }
        pkpt.setFileBuktiData(null);
        pkpt.setFileBuktiNama(null);
        pkpt.setFileBuktiUkuran(null);
        pkptRepository.save(pkpt);
        return ResponseEntity.ok().build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Berkas PDF wajib dipilih");
        }
        String namaFile = file.getOriginalFilename();
        boolean isPdf = "application/pdf".equals(file.getContentType())
                || (namaFile != null && namaFile.toLowerCase().endsWith(".pdf"));
        if (!isPdf) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Berkas wajib berformat PDF");
        }
        long maxSize = 10L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ukuran berkas maksimal 10MB");
        }
    }

    /** Dipakai bersama KepalaSpiPkptController supaya Kepala SPI juga bisa melihat berkas yang sama. */
    public static ResponseEntity<byte[]> buildFileResponse(Pkpt pkpt) {
        if (pkpt.getFileBuktiData() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PKPT ini belum punya berkas PDF");
        }
        String namaFile = StringUtils.hasText(pkpt.getFileBuktiNama())
                ? pkpt.getFileBuktiNama().replace("\"", "")
                : "pkpt-" + pkpt.getPkptId() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + namaFile + "\"")
                .body(pkpt.getFileBuktiData());
    }

    private void validate(CreatePkptRequest request) {
        if (request == null
                || request.getTahunAnggaran() == null
                || !StringUtils.hasText(request.getNamaPkpt())
                || request.getTanggalMulai() == null
                || request.getTanggalSelesai() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tahun anggaran, nama PKPT, dan periode wajib diisi");
        }
        if (request.getTanggalSelesai().isBefore(request.getTanggalMulai())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tanggal selesai tidak boleh sebelum tanggal mulai");
        }
    }

    /**
     * Staf menambahkan objek pengawasan setelah PKPT diterbitkan -- inilah
     * yang jadi bahan Ketua Tim memilih objek saat mengusulkan PPP
     * (lihat KetuaTimPppController.getObjekOptions()).
     */
    @PostMapping("/{id}/objek")
    public ResponseEntity<Void> tambahObjek(@PathVariable Integer id, @RequestBody ObjekPengawasanInput request) {
        Pkpt pkpt = findOrThrow(id);
        if (!STATUS_DITERBITKAN.equals(pkpt.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Objek pengawasan hanya bisa ditambahkan setelah PKPT diterbitkan");
        }
        objekPengawasanRepository.save(buildObjek(pkpt, request));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}/objek/{objekId}")
    public ResponseEntity<Void> ubahObjek(@PathVariable Integer id, @PathVariable Integer objekId,
                                          @RequestBody ObjekPengawasanInput request) {
        Pkpt pkpt = findOrThrow(id);
        ObjekPengawasan objek = findObjekOrThrow(pkpt, objekId);
        if (sudahDipakaiPpp(objekId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Objek pengawasan ini sudah dipakai PPP, tidak bisa diubah");
        }
        if (!StringUtils.hasText(request.getUnitKerja()) || !StringUtils.hasText(request.getJenisPengawasan())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja dan jenis pengawasan wajib diisi");
        }
        objek.setUnit(resolveUnit(request.getUnitKerja()));
        objek.setJenisPengawasan(request.getJenisPengawasan().trim());
        objek.setPrioritasRisiko(StringUtils.hasText(request.getPrioritasRisiko()) ? request.getPrioritasRisiko() : "Sedang");
        objekPengawasanRepository.save(objek);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/objek/{objekId}")
    public ResponseEntity<Void> hapusObjek(@PathVariable Integer id, @PathVariable Integer objekId) {
        Pkpt pkpt = findOrThrow(id);
        ObjekPengawasan objek = findObjekOrThrow(pkpt, objekId);
        if (sudahDipakaiPpp(objekId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Objek pengawasan ini sudah dipakai PPP, tidak bisa dihapus");
        }
        objekPengawasanRepository.delete(objek);
        return ResponseEntity.ok().build();
    }

    private ObjekPengawasan findObjekOrThrow(Pkpt pkpt, Integer objekId) {
        ObjekPengawasan objek = objekPengawasanRepository.findById(objekId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Objek pengawasan tidak ditemukan"));
        if (objek.getPkpt() == null || !pkpt.getPkptId().equals(objek.getPkpt().getPkptId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Objek pengawasan ini bukan milik PKPT ini");
        }
        return objek;
    }

    private boolean sudahDipakaiPpp(Integer objekId) {
        return penugasanPppRepository.findAll().stream()
                .anyMatch(p -> p.getObjek() != null && objekId.equals(p.getObjek().getObjekId()));
    }

    private Unit resolveUnit(String namaUnit) {
        return unitRepository.findAll().stream()
                .filter(u -> u.getNamaUnit().equalsIgnoreCase(namaUnit))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja tidak dikenali"));
    }

    private ObjekPengawasan buildObjek(Pkpt pkpt, ObjekPengawasanInput input) {
        if (!StringUtils.hasText(input.getUnitKerja()) || !StringUtils.hasText(input.getJenisPengawasan())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja dan jenis pengawasan wajib diisi");
        }
        return ObjekPengawasan.builder()
                .pkpt(pkpt)
                .unit(resolveUnit(input.getUnitKerja()))
                .jenisPengawasan(input.getJenisPengawasan().trim())
                .prioritasRisiko(StringUtils.hasText(input.getPrioritasRisiko()) ? input.getPrioritasRisiko() : "Sedang")
                .status("Terjadwal")
                .build();
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
                .fileBuktiNama(pkpt.getFileBuktiNama())
                .fileBuktiUkuran(pkpt.getFileBuktiUkuran())
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
