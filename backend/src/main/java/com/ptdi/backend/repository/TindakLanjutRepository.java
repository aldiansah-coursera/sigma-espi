package com.ptdi.backend.repository;

import com.ptdi.backend.entity.TindakLanjut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TindakLanjutRepository extends JpaRepository<TindakLanjut, Integer> {
    @Modifying
    @Query("UPDATE TindakLanjut t SET t.auditee = null WHERE t.auditee.userId = :userId")
    int clearAuditeeForUser(@Param("userId") Integer userId);
}
