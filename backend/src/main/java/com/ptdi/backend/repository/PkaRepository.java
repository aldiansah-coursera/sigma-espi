package com.ptdi.backend.repository;

import com.ptdi.backend.entity.Pka;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PkaRepository extends JpaRepository<Pka, Integer> {
    @Modifying
    @Query("UPDATE Pka p SET p.disetujuiOleh = null WHERE p.disetujuiOleh.userId = :userId")
    int clearDisetujuiOlehForUser(@Param("userId") Integer userId);
}
