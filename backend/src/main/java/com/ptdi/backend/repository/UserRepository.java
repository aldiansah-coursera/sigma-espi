package com.ptdi.backend.repository;

import com.ptdi.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNip(String nip);

    List<User> findByStatus(String status);

    List<User> findByStatusIn(Collection<String> statuses);
}
