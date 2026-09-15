package com.ptdi.backend.repository;

import com.ptdi.backend.entity.PenugasanSta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PenugasanStaRepository extends JpaRepository<PenugasanSta, Integer> {
    // dipakai UserDeletionService -- ketua_tim_id NOT NULL, sama seperti
    // Kka.pembuat -- hard-delete dibatalkan kalau user masih jadi Ketua Tim.
    long countByKetuaTimUserId(Integer userId);

    java.util.List<PenugasanSta> findAllByOrderByPenugasanIdDesc();

    @Modifying
    @Query("UPDATE PenugasanSta p SET p.diterbitkanOleh = null WHERE p.diterbitkanOleh.userId = :userId")
    int clearDiterbitkanOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE PenugasanSta p SET p.dibuatOleh = null WHERE p.dibuatOleh.userId = :userId")
    int clearDibuatOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE PenugasanSta p SET p.didistribusikanOleh = null WHERE p.didistribusikanOleh.userId = :userId")
    int clearDidistribusikanOlehForUser(@Param("userId") Integer userId);
}
