package com.ptdi.backend.repository;

import com.ptdi.backend.entity.RegulasiTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RegulasiTemplateRepository extends JpaRepository<RegulasiTemplate, Integer> {
    List<RegulasiTemplate> findAllByOrderByRegulasiIdDesc();

    @Modifying
    @Query("UPDATE RegulasiTemplate r SET r.uploadedBy = null WHERE r.uploadedBy.userId = :userId")
    int clearUploadedByForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE RegulasiTemplate r SET r.direviewOleh = null WHERE r.direviewOleh.userId = :userId")
    int clearDireviewOlehForUser(@Param("userId") Integer userId);
}
