package com.ptdi.backend.repository;

import com.ptdi.backend.entity.Notifikasi;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotifikasiRepository extends JpaRepository<Notifikasi, Integer> {
    // Notifikasi murni milik user itu sendiri -- ikut dihapus, lihat
    // UserDeletionService.
    void deleteByUserUserId(Integer userId);
}
