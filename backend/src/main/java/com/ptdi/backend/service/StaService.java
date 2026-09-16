package com.ptdi.backend.service;

import com.ptdi.backend.dto.StaResponse;
import com.ptdi.backend.entity.ObjekPengawasan;
import com.ptdi.backend.entity.PenugasanSta;
import com.ptdi.backend.entity.Pkpt;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * Helper bersama alur Surat Tugas (ST) tahap 08-10 flowmap SIGMA v3.0:
 * Dukungan Audit (role tunggal, tidak lagi dipecah staf/koordinator)
 * membuat draf, mengajukan, & mendistribusikan sendiri; Kepala SPI
 * menandatangani.
 */
@Service
@RequiredArgsConstructor
public class StaService {

    public static final String STATUS_DRAFT = "Draft";
    public static final String STATUS_DIAJUKAN = "Diajukan";
    public static final String STATUS_DITANDATANGANI = "Ditandatangani";
    public static final String STATUS_DIDISTRIBUSIKAN = "Didistribusikan";
    /** Data lama sebelum alur v3.0 -- dianggap sudah beredar. */
    public static final String STATUS_LAMA_ACTIVE = "Active";
    private final PenugasanStaRepository penugasanStaRepository;
    private final UserRepository userRepository;

    public PenugasanSta findOrThrow(Integer id) {
        return penugasanStaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Surat Tugas tidak ditemukan"));
    }

    public User currentUser(Jwt jwt) {
        return userRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("User tidak ditemukan"));
    }

    public StaResponse toResponse(PenugasanSta sta) {
        ObjekPengawasan objek = sta.getObjek();
        Pkpt pkpt = objek != null ? objek.getPkpt() : null;
        return StaResponse.builder()
                .penugasanId(sta.getPenugasanId())
                .nomorSta(sta.getNomorSta())
                .tanggalTerbit(sta.getTanggalTerbit() != null ? sta.getTanggalTerbit().toString() : null)
                .tanggalMulai(sta.getTanggalMulai() != null ? sta.getTanggalMulai().toString() : null)
                .tanggalSelesai(sta.getTanggalSelesai() != null ? sta.getTanggalSelesai().toString() : null)
                .ruangLingkup(sta.getRuangLingkup())
                .targetAudit(sta.getTargetAudit())
                .objekAudit(objek != null ? objek.getJenisPengawasan() : null)
                .unitKerja(objek != null && objek.getUnit() != null ? objek.getUnit().getNamaUnit() : null)
                .periode(pkpt != null && pkpt.getTahunAnggaran() != null ? pkpt.getTahunAnggaran().toString() : null)
                .ketuaTim(sta.getKetuaTim() != null ? sta.getKetuaTim().getNama() : null)
                .diterbitkanOleh(sta.getDiterbitkanOleh() != null ? sta.getDiterbitkanOleh().getNama() : null)
                .statusApproval(sta.getStatusApproval())
                .pppId(sta.getPpp() != null ? sta.getPpp().getPppId() : null)
                .dibuatOleh(sta.getDibuatOleh() != null ? sta.getDibuatOleh().getNama() : null)
                .didistribusikanOleh(sta.getDidistribusikanOleh() != null ? sta.getDidistribusikanOleh().getNama() : null)
                .tanggalDistribusi(sta.getTanggalDistribusi() != null ? sta.getTanggalDistribusi().toString() : null)
                .catatanRevisi(sta.getCatatanRevisi())
                .komposisiTim(sta.getPpp() != null ? sta.getPpp().getKomposisiTim() : null)
                .build();
    }
}
