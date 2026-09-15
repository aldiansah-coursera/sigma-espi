package com.ptdi.backend.repository;

import com.ptdi.backend.entity.AnggotaTim;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnggotaTimRepository extends JpaRepository<AnggotaTim, Integer> {
    // Keanggotaan tim (bukan dokumen resmi) -- aman ikut dihapus saat akun
    // usernya dihapus permanen, lihat UserDeletionService.
    void deleteByUserUserId(Integer userId);
}
