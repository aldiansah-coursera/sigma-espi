package com.ptdi.backend.repository;

import com.ptdi.backend.entity.DataReferensi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DataReferensiRepository extends JpaRepository<DataReferensi, Integer> {
    @Modifying
    @Query("UPDATE DataReferensi d SET d.dikelolaOleh = null WHERE d.dikelolaOleh.userId = :userId")
    int clearDikelolaOlehForUser(@Param("userId") Integer userId);
}
