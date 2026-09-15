package com.ptdi.backend.repository;

import com.ptdi.backend.entity.AuditTrailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditTrailLogRepository extends JpaRepository<AuditTrailLog, Integer> {
    @Modifying
    @Query("UPDATE AuditTrailLog a SET a.user = null WHERE a.user.userId = :userId")
    int clearUserForUser(@Param("userId") Integer userId);
}
