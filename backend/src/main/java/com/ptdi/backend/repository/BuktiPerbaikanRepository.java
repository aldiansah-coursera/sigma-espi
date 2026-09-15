package com.ptdi.backend.repository;

import com.ptdi.backend.entity.BuktiPerbaikan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BuktiPerbaikanRepository extends JpaRepository<BuktiPerbaikan, Integer> {
    @Modifying
    @Query("UPDATE BuktiPerbaikan b SET b.divalidasiOleh = null WHERE b.divalidasiOleh.userId = :userId")
    int clearDivalidasiOlehForUser(@Param("userId") Integer userId);
}
