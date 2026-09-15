package com.ptdi.backend.repository;

import com.ptdi.backend.entity.PenugasanPpp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PenugasanPppRepository extends JpaRepository<PenugasanPpp, Integer> {

    List<PenugasanPpp> findAllByOrderByPppIdDesc();

    @Modifying
    @Query("UPDATE PenugasanPpp p SET p.diusulkanOleh = null WHERE p.diusulkanOleh.userId = :userId")
    int clearDiusulkanOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE PenugasanPpp p SET p.disetujuiPengawas = null WHERE p.disetujuiPengawas.userId = :userId")
    int clearDisetujuiPengawasForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE PenugasanPpp p SET p.disetujuiKepalaSpi = null WHERE p.disetujuiKepalaSpi.userId = :userId")
    int clearDisetujuiKepalaSpiForUser(@Param("userId") Integer userId);
}
