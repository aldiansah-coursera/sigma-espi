package com.ptdi.backend.repository;

import com.ptdi.backend.entity.ProfilKompetensiAuditor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfilKompetensiAuditorRepository extends JpaRepository<ProfilKompetensiAuditor, Integer> {
    // Profil kompetensi 1:1 milik user itu sendiri -- ikut dihapus, lihat
    // UserDeletionService.
    void deleteByUserUserId(Integer userId);
}
