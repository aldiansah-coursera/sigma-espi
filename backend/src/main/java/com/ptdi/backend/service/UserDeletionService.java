package com.ptdi.backend.service;

import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.AnggotaTimRepository;
import com.ptdi.backend.repository.AuditTrailLogRepository;
import com.ptdi.backend.repository.BuktiPerbaikanRepository;
import com.ptdi.backend.repository.DataReferensiRepository;
import com.ptdi.backend.repository.KkaRepository;
import com.ptdi.backend.repository.LhaRepository;
import com.ptdi.backend.repository.NotifikasiRepository;
import com.ptdi.backend.repository.PasswordResetTokenRepository;
import com.ptdi.backend.repository.PenugasanStaRepository;
import com.ptdi.backend.repository.PkaRepository;
import com.ptdi.backend.repository.PenugasanPppRepository;
import com.ptdi.backend.repository.PkptRepository;
import com.ptdi.backend.repository.ProfilKompetensiAuditorRepository;
import com.ptdi.backend.repository.RegulasiTemplateRepository;
import com.ptdi.backend.repository.SurveiKepuasanRepository;
import com.ptdi.backend.repository.TindakLanjutRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Menghapus akun user secara permanen (hard delete) dari tabel users,
 * dipakai AdminUserController saat Admin menekan tombol "Hapus" di Kelola
 * User.
 *
 * Satu user bisa direferensikan banyak tabel lain (dia yang membuat KKA,
 * menyetujui PKA/LHA, jadi Ketua Tim di STA, dst) -- supaya hapus akun
 * tidak diam-diam gagal (500 tanpa pesan jelas) ATAU malah merusak dokumen
 * audit resmi yang sudah ada, aturan mainnya:
 *
 *  1. Kalau user pernah membuat KKA (Kka.pembuat) atau ditunjuk sebagai
 *     Ketua Tim di STA (PenugasanSta.ketuaTim) -- dua kolom ini WAJIB diisi
 *     (NOT NULL) di dokumen resminya -- hapus DIBATALKAN dengan pesan jelas,
 *     karena menghapus user ini akan merusak jejak dokumen tersebut.
 *  2. Referensi opsional lain (siapa yang menyetujui/mereviu/mengunggah/
 *     mengelola sesuatu) sengaja dibuat nullable di skema -- jadi
 *     dikosongkan (bukan ikut dihapus), dokumennya tetap ada, cuma catatan
 *     "siapa"-nya yang lepas.
 *  3. Data yang murni milik user itu sendiri (notifikasi, token reset
 *     password, keanggotaan tim, profil kompetensi auditor) ikut dihapus.
 */
@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final UserRepository userRepository;
    private final KkaRepository kkaRepository;
    private final PenugasanStaRepository penugasanStaRepository;
    private final AuditTrailLogRepository auditTrailLogRepository;
    private final BuktiPerbaikanRepository buktiPerbaikanRepository;
    private final DataReferensiRepository dataReferensiRepository;
    private final LhaRepository lhaRepository;
    private final PkaRepository pkaRepository;
    private final PkptRepository pkptRepository;
    private final PenugasanPppRepository penugasanPppRepository;
    private final RegulasiTemplateRepository regulasiTemplateRepository;
    private final SurveiKepuasanRepository surveiKepuasanRepository;
    private final TindakLanjutRepository tindakLanjutRepository;
    private final AnggotaTimRepository anggotaTimRepository;
    private final NotifikasiRepository notifikasiRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ProfilKompetensiAuditorRepository profilKompetensiAuditorRepository;

    @Transactional
    public void hardDelete(User user) {
        Integer userId = user.getUserId();

        long kkaDibuat = kkaRepository.countByPembuatUserId(userId);
        long staKetuaTim = penugasanStaRepository.countByKetuaTimUserId(userId);
        if (kkaDibuat > 0 || staKetuaTim > 0) {
            StringBuilder detail = new StringBuilder();
            if (kkaDibuat > 0) {
                detail.append(kkaDibuat).append(" KKA (sebagai pembuat)");
            }
            if (staKetuaTim > 0) {
                if (!detail.isEmpty()) {
                    detail.append(" dan ");
                }
                detail.append(staKetuaTim).append(" STA (sebagai Ketua Tim)");
            }
            throw new ApiException(HttpStatus.CONFLICT,
                    "Akun ini tidak bisa dihapus permanen karena masih tercatat sebagai " + detail
                            + " -- menghapusnya akan merusak jejak dokumen audit resmi tersebut. "
                            + "Nonaktifkan saja akunnya, atau pindahkan dulu dokumen itu ke user lain "
                            + "sebelum menghapus akun ini.");
        }

        // Lepaskan referensi opsional di dokumen lain (kolomnya nullable) --
        // dokumen tetap ada, cuma catatan "siapa"-nya jadi kosong.
        auditTrailLogRepository.clearUserForUser(userId);
        buktiPerbaikanRepository.clearDivalidasiOlehForUser(userId);
        dataReferensiRepository.clearDikelolaOlehForUser(userId);
        kkaRepository.clearDivalidasiOlehForUser(userId);
        lhaRepository.clearDireviuQaOlehForUser(userId);
        lhaRepository.clearDisetujuiOlehForUser(userId);
        penugasanStaRepository.clearDiterbitkanOlehForUser(userId);
        penugasanStaRepository.clearDibuatOlehForUser(userId);
        penugasanStaRepository.clearDidistribusikanOlehForUser(userId);
        pkaRepository.clearDisetujuiOlehForUser(userId);
        pkptRepository.clearDibuatOlehForUser(userId);
        pkptRepository.clearDisahkanOlehForUser(userId);
        pkptRepository.clearDiterbitkanOlehForUser(userId);
        penugasanPppRepository.clearDiusulkanOlehForUser(userId);
        penugasanPppRepository.clearDisetujuiPengawasForUser(userId);
        penugasanPppRepository.clearDisetujuiKepalaSpiForUser(userId);
        regulasiTemplateRepository.clearUploadedByForUser(userId);
        regulasiTemplateRepository.clearDireviewOlehForUser(userId);
        surveiKepuasanRepository.clearAuditeeForUser(userId);
        tindakLanjutRepository.clearAuditeeForUser(userId);

        // Hapus data yang murni milik user ini sendiri.
        anggotaTimRepository.deleteByUserUserId(userId);
        notifikasiRepository.deleteByUserUserId(userId);
        passwordResetTokenRepository.deleteByUserUserId(userId);
        profilKompetensiAuditorRepository.deleteByUserUserId(userId);

        userRepository.delete(user);
    }
}
