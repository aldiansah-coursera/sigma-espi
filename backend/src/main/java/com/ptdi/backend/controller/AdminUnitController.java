package com.ptdi.backend.controller;

import com.ptdi.backend.dto.UnitRequest;
import com.ptdi.backend.dto.UnitResponse;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/units")
@RequiredArgsConstructor
public class AdminUnitController {

    private final UnitRepository unitRepository;

    /**
     * Dipakai dropdown Unit Kerja di tempat lain (Kelola User, dst) --
     * bentuk lama (List<String>), TIDAK diubah supaya konsumen yang sudah
     * ada tidak ikut rusak.
     */
    @GetMapping
    public List<String> getUnits() {
        return unitRepository.findAll().stream()
                .map(Unit::getNamaUnit)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    /**
     * Poin review klien: Admin perlu bisa kelola (tambah/ubah/hapus) master
     * data Unit Kerja -- bentuk baru dengan id, dipakai halaman Kelola Unit
     * Kerja.
     */
    @GetMapping("/manage")
    public List<UnitResponse> getUnitsForManagement() {
        return unitRepository.findAll().stream()
                .sorted(Comparator.comparing(Unit::getNamaUnit, Comparator.naturalOrder()))
                .map(u -> UnitResponse.builder().id(u.getUnitId()).namaUnit(u.getNamaUnit()).build())
                .toList();
    }

    @PostMapping
    public ResponseEntity<UnitResponse> createUnit(@RequestBody UnitRequest request) {
        String namaUnit = validateNama(request);
        ensureNamaBelumDipakai(namaUnit, null);

        Unit unit = unitRepository.save(Unit.builder().namaUnit(namaUnit).build());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UnitResponse.builder().id(unit.getUnitId()).namaUnit(unit.getNamaUnit()).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnitResponse> updateUnit(@PathVariable Integer id, @RequestBody UnitRequest request) {
        String namaUnit = validateNama(request);
        ensureNamaBelumDipakai(namaUnit, id);

        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit kerja tidak ditemukan"));
        unit.setNamaUnit(namaUnit);
        unitRepository.save(unit);

        return ResponseEntity.ok(UnitResponse.builder().id(unit.getUnitId()).namaUnit(unit.getNamaUnit()).build());
    }

    /**
     * Hapus Unit Kerja -- kalau masih dipakai user/objek pengawasan lain,
     * database akan menolak (FK constraint) dan otomatis ditangani
     * GlobalExceptionHandler jadi pesan 409 yang jelas, bukan error 500
     * kosong.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Integer id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unit kerja tidak ditemukan"));
        unitRepository.delete(unit);
        return ResponseEntity.ok().build();
    }

    private String validateNama(UnitRequest request) {
        if (request == null || !StringUtils.hasText(request.getNamaUnit())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nama unit kerja wajib diisi");
        }
        return request.getNamaUnit().trim();
    }

    private void ensureNamaBelumDipakai(String namaUnit, Integer excludeId) {
        boolean sudahAda = unitRepository.findAll().stream()
                .anyMatch(u -> namaUnit.equalsIgnoreCase(u.getNamaUnit())
                        && (excludeId == null || !u.getUnitId().equals(excludeId)));
        if (sudahAda) {
            throw new ApiException(HttpStatus.CONFLICT, "Unit kerja dengan nama itu sudah ada");
        }
    }
}
