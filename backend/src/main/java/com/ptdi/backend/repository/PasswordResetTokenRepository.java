package com.ptdi.backend.repository;

import com.ptdi.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findByToken(String token);

    // Token reset password murni milik user itu sendiri -- ikut dihapus,
    // lihat UserDeletionService.
    void deleteByUserUserId(Integer userId);
}
