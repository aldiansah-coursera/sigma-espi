package com.ptdi.backend.controller;

import com.ptdi.backend.dto.ReferensiRequest;
import com.ptdi.backend.dto.ReferensiResponse;
import com.ptdi.backend.entity.DataReferensi;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.DataReferensiRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

/**
 * Tahap 03 flowmap SIGMA v3.0 -- Administrator "Mengelola Parameter Risiko,
 * Referensi & Regulasi". Satu tabel data_referensi dipakai untuk ketiganya,
 * dibedakan lewat kolom kategori (lihat KATEGORI_TERSEDIA).
 */
@RestController
@RequestMapping("/api/admin/referensi")
@RequiredArgsConstructor
public class AdminReferensiController {

    public static final List<String> KATEGORI_TERSEDIA = List.of(
            "Parameter Risiko", "Data Referensi", "Regulasi"
    );

    private final DataReferensiRepository dataReferensiRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<ReferensiResponse> getAll() {
        return dataReferensiRepository.findAll().stream()
                .sorted(Comparator.comparing(DataReferensi::getKategori, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(DataReferensi::getKode, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/kategori-options")
    public List<String> getKategoriOptions() {
        return KATEGORI_TERSEDIA;
    }

    @PostMapping
    public ResponseEntity<ReferensiResponse> create(@RequestBody ReferensiRequest request, @AuthenticationPrincipal Jwt jwt) {
        validate(request);
        ensureKodeBelumDipakai(request.getKategori().trim(), request.getKode().trim(), null);

        DataReferensi referensi = DataReferensi.builder()
                .kategori(request.getKategori().trim())
                .kode(request.getKode().trim())
                .nilai(request.getNilai().trim())
                .dikelolaOleh(currentUser(jwt))
                .build();
        referensi = dataReferensiRepository.save(referensi);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(referensi));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReferensiResponse> update(@PathVariable Integer id, @RequestBody ReferensiRequest request,
                                                    @AuthenticationPrincipal Jwt jwt) {
        validate(request);
        ensureKodeBelumDipakai(request.getKategori().trim(), request.getKode().trim(), id);

        DataReferensi referensi = findOrThrow(id);
        referensi.setKategori(request.getKategori().trim());
        referensi.setKode(request.getKode().trim());
        referensi.setNilai(request.getNilai().trim());
        referensi.setDikelolaOleh(currentUser(jwt));
        dataReferensiRepository.save(referensi);

        return ResponseEntity.ok(toResponse(referensi));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        dataReferensiRepository.delete(findOrThrow(id));
        return ResponseEntity.ok().build();
    }

    private void validate(ReferensiRequest request) {
        if (request == null || !StringUtils.hasText(request.getKategori())
                || !StringUtils.hasText(request.getKode()) || !StringUtils.hasText(request.getNilai())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Kategori, kode, dan nilai wajib diisi");
        }
        if (!KATEGORI_TERSEDIA.contains(request.getKategori().trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Kategori tidak dikenali");
        }
    }

    private void ensureKodeBelumDipakai(String kategori, String kode, Integer excludeId) {
        boolean sudahAda = dataReferensiRepository.findAll().stream()
                .anyMatch(d -> kategori.equalsIgnoreCase(d.getKategori())
                        && kode.equalsIgnoreCase(d.getKode())
                        && (excludeId == null || !d.getRefId().equals(excludeId)));
        if (sudahAda) {
            throw new ApiException(HttpStatus.CONFLICT, "Kode itu sudah dipakai pada kategori yang sama");
        }
    }

    private DataReferensi findOrThrow(Integer id) {
        return dataReferensiRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Data referensi tidak ditemukan"));
    }

    private ReferensiResponse toResponse(DataReferensi d) {
        return ReferensiResponse.builder()
                .refId(d.getRefId())
                .kategori(d.getKategori())
                .kode(d.getKode())
                .nilai(d.getNilai())
                .dikelolaOleh(d.getDikelolaOleh() != null ? d.getDikelolaOleh().getNama() : null)
                .build();
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
