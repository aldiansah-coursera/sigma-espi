package com.ptdi.backend.repository;

import com.ptdi.backend.entity.SurveiKepuasan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveiKepuasanRepository extends JpaRepository<SurveiKepuasan, Integer> {
    @Modifying
    @Query("UPDATE SurveiKepuasan s SET s.auditee = null WHERE s.auditee.userId = :userId")
    int clearAuditeeForUser(@Param("userId") Integer userId);
}
