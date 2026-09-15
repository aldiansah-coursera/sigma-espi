package com.ptdi.backend.service;

import com.ptdi.backend.dto.PppResponse;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.PenugasanPpp;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * Helper bersama untuk 3 gerbang PPP (Ketua Tim -> Pengawas -> Kepala SPI)
 * supaya konstanta status, bentuk respons, dan pencarian data-nya persis
 * sama di ketiga controller.
 */
@Service
@RequiredArgsConstructor
public class PppService {

    public static final String STATUS_DRAFT = "Draft";
    public static final String STATUS_DIAJUKAN = "Diajukan";
    public static final String STATUS_DITERUSKAN = "Diteruskan";
    public static final String STATUS_DISETUJUI = "Disetujui";

    private final PenugasanPppRepository penugasanPppRepository;
    private final UserRepository userRepository;

    public PenugasanPpp findOrThrow(Integer id) {
        return penugasanPppRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PPP tidak ditemukan"));
    }

    public User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }

    public PppResponse toResponse(PenugasanPpp p) {
        ObjekPengawasan objek = p.getObjek();
        return PppResponse.builder()
                .pppId(p.getPppId())
                .objekId(objek != null ? objek.getObjekId() : null)
                .namaPkpt(objek != null && objek.getPkpt() != null ? objek.getPkpt().getNamaPkpt() : null)
                .unitKerja(objek != null && objek.getUnit() != null ? objek.getUnit().getNamaUnit() : null)
                .jenisPengawasan(objek != null ? objek.getJenisPengawasan() : null)
                .prioritasRisiko(objek != null ? objek.getPrioritasRisiko() : null)
                .ruangLingkup(p.getRuangLingkup())
                .sasaranAudit(p.getSasaranAudit())
                .komposisiTim(p.getKomposisiTim())
                .tanggalMulai(p.getTanggalMulai() != null ? p.getTanggalMulai().toString() : null)
                .tanggalSelesai(p.getTanggalSelesai() != null ? p.getTanggalSelesai().toString() : null)
                .status(p.getStatus())
                .diusulkanOleh(p.getDiusulkanOleh() != null ? p.getDiusulkanOleh().getNama() : null)
                .disetujuiPengawas(p.getDisetujuiPengawas() != null ? p.getDisetujuiPengawas().getNama() : null)
                .disetujuiKepalaSpi(p.getDisetujuiKepalaSpi() != null ? p.getDisetujuiKepalaSpi().getNama() : null)
                .catatanRevisi(p.getCatatanRevisi())
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .build();
    }
}
