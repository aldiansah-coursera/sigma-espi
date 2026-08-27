package com.ptdi.backend.controller;

import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * Daftar Unit Kerja untuk form Objek Pengawasan di halaman Persetujuan PKPT
 * milik Kepala SPI. Endpoint terpisah dari /api/admin/units karena rule
 * keamanan /api/admin/** dikunci khusus ROLE_ADMIN — Kepala SPI perlu path
 * sendiri di bawah /api/kepala-spi/** yang sudah diizinkan untuk ROLE_KEPALA_SPI.
 */
@RestController
@RequestMapping("/api/kepala-spi/units")
@RequiredArgsConstructor
public class KepalaSpiUnitController {

    private final UnitRepository unitRepository;

    @GetMapping
    public List<String> getUnits() {
        return unitRepository.findAll().stream()
                .map(Unit::getNamaUnit)
                .sorted(Comparator.naturalOrder())
                .toList();
    }
}
