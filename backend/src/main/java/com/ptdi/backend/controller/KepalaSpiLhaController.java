package com.ptdi.backend.controller;

import com.ptdi.backend.dto.LhaResponse;
import com.ptdi.backend.dto.LhaSummaryResponse;
import com.ptdi.backend.entity.AnggotaTim;
import com.ptdi.backend.entity.Lha;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.AnggotaTimRepository;
import com.ptdi.backend.repository.LhaRepository;
import com.ptdi.backend.repository.TemuanKkptRepository;
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

/**
 * Otorisasi akhir LHA (Laporan Hasil Audit) oleh Kepala SPI — lane
 * "Otorisasi Akhir?" + "Publikasikan LHA ke Portal Auditee" di
 * Flowmap-SIGMA-v2.0. Endpoint ini nyata (bukan data mock), tapi daftarnya
 * akan kosong sampai alur Ketua Tim -> Tim QA di atasnya (PKA, KKA, reviu
 * QA, generate draf LHA otomatis) benar-benar dibangun — belum ada
 * dashboard/endpoint untuk role-role itu per 27 Agustus 2026.
 *
 * Konvensi status yang dipakai (belum ada enum resmi di ERD): draf LHA
 * yang siap ditinjau tapi belum disahkan Kepala SPI berstatus "Ready";
 * setelah endpoint /authorize dipanggil, statusnya menjadi "Approved".
 * "Critical / High Findings" dihitung nyata dari TEMUAN_KKPT (via KKA),
 * bukan angka statis — akan tetap 0 sampai ada data KKA/Temuan.
 */
@RestController
@RequestMapping("/api/kepala-spi/lha")
@RequiredArgsConstructor
public class KepalaSpiLhaController {

    private static final String STATUS_APPROVED = "Approved";
    private static final Set<String> HIGH_PRIORITY_KEYWORDS = Set.of("tinggi", "kritis", "critical", "high");

    private final LhaRepository lhaRepository;
    private final AnggotaTimRepository anggotaTimRepository;
    private final TemuanKkptRepository temuanKkptRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<LhaResponse> getAll() {
        List<AnggotaTim> allAnggota = anggotaTimRepository.findAll();
        return lhaRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getLhaId(), a.getLhaId()))
                .map(lha -> toResponse(lha, allAnggota))
                .toList();
    }

    @GetMapping("/summary")
    public LhaSummaryResponse getSummary() {
        List<Lha> allLha = lhaRepository.findAll();

        int menungguOtorisasi = (int) allLha.stream()
                .filter(l -> !STATUS_APPROVED.equals(l.getStatus()))
                .count();

        int tahunIni = LocalDate.now().getYear();
        int lhaDiterbitkanTahunIni = (int) allLha.stream()
                .filter(l -> STATUS_APPROVED.equals(l.getStatus()))
                .filter(l -> l.getTanggalTerbit() != null && l.getTanggalTerbit().getYear() == tahunIni)
                .count();

        int criticalHighFindings = (int) temuanKkptRepository.findAll().stream()
                .filter(t -> t.getPrioritas() != null && HIGH_PRIORITY_KEYWORDS.contains(t.getPrioritas().trim().toLowerCase()))
                .count();

        return LhaSummaryResponse.builder()
                .menungguOtorisasi(menungguOtorisasi)
                .lhaDiterbitkanTahunIni(lhaDiterbitkanTahunIni)
                .criticalHighFindings(criticalHighFindings)
                .build();
    }

    @PostMapping("/{id}/authorize")
    public ResponseEntity<Void> authorize(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        Lha lha = lhaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LHA tidak ditemukan"));
        User current = currentUser(jwt);
        lha.setDisetujuiOleh(current);
        lha.setStatus(STATUS_APPROVED);
        lha.setTanggalTerbit(LocalDate.now());
        lhaRepository.save(lha);
        return ResponseEntity.ok().build();
    }

    private LhaResponse toResponse(Lha lha, List<AnggotaTim> allAnggota) {
        PenugasanSta sta = lha.getPenugasan();
        ObjekPengawasan objek = sta != null ? sta.getObjek() : null;
        long anggotaCount = sta == null ? 0 : allAnggota.stream()
                .filter(a -> a.getPenugasan() != null && sta.getPenugasanId().equals(a.getPenugasan().getPenugasanId()))
                .count();

        int nomorTahun = lha.getTanggalTerbit() != null ? lha.getTanggalTerbit().getYear() : LocalDate.now().getYear();
        String nomorLha = String.format("LHA/SPI/%d/%03d", nomorTahun, lha.getLhaId());

        return LhaResponse.builder()
                .lhaId(lha.getLhaId())
                .penugasanId(sta != null ? sta.getPenugasanId() : null)
                .nomorLha(nomorLha)
                .nomorSta(sta != null ? sta.getNomorSta() : null)
                .objekAudit(objek != null ? objek.getJenisPengawasan() : null)
                .ketuaTim(sta != null && sta.getKetuaTim() != null ? sta.getKetuaTim().getNama() : null)
                .anggotaTimCount((int) anggotaCount)
                .status(lha.getStatus())
                .statusQa(lha.getStatusQa())
                .tanggalTerbit(lha.getTanggalTerbit() != null ? lha.getTanggalTerbit().toString() : null)
                .disetujuiOleh(lha.getDisetujuiOleh() != null ? lha.getDisetujuiOleh().getNama() : null)
                .fileUrl(lha.getFileUrl())
                .build();
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }
}
