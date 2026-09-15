package com.ptdi.backend.repository;

import com.ptdi.backend.entity.Pkpt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PkptRepository extends JpaRepository<Pkpt, Integer> {
    java.util.List<Pkpt> findAllByOrderByPkptIdDesc();

    @Modifying
    @Query("UPDATE Pkpt p SET p.dibuatOleh = null WHERE p.dibuatOleh.userId = :userId")
    int clearDibuatOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE Pkpt p SET p.disahkanOleh = null WHERE p.disahkanOleh.userId = :userId")
    int clearDisahkanOlehForUser(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE Pkpt p SET p.diterbitkanOleh = null WHERE p.diterbitkanOleh.userId = :userId")
    int clearDiterbitkanOlehForUser(@Param("userId") Integer userId);
}
