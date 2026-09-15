package com.ptdi.backend.repository;

import com.ptdi.backend.entity.Lha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LhaRepository extends JpaRepository<Lha, Integer> {
    @Modifying
    @Query("UPDATE Lha l SET l.direviuQaOleh = null WHERE l.direviuQaOleh.userId = :userId")
    int clearDireviuQaOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE Lha l SET l.disetujuiOleh = null WHERE l.disetujuiOleh.userId = :userId")
    int clearDisetujuiOlehForUser(@Param("userId") Integer userId);
}
