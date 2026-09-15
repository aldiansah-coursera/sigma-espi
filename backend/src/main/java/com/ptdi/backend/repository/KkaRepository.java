package com.ptdi.backend.repository;

import com.ptdi.backend.entity.Kka;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KkaRepository extends JpaRepository<Kka, Integer> {
    // dipakai UserDeletionService -- KKA.pembuat_id NOT NULL, jadi kalau ada
    // baris yang masih menunjuk ke user ini, hard-delete akun harus dibatalkan
    // (bukan dikosongkan) supaya tidak melanggar constraint / merusak dokumen.
    long countByPembuatUserId(Integer userId);

    @Modifying
    @Query("UPDATE Kka k SET k.divalidasiOleh = null WHERE k.divalidasiOleh.userId = :userId")
    int clearDivalidasiOlehForUser(@Param("userId") Integer userId);
}
