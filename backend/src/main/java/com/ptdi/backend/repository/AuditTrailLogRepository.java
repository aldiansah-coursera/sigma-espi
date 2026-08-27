package com.ptdi.backend.repository;

import com.ptdi.backend.entity.AuditTrailLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditTrailLogRepository extends JpaRepository<AuditTrailLog, Integer> {
}
