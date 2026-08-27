package com.ptdi.backend.controller;

import com.ptdi.backend.dto.ActiveUserResponse;
import com.ptdi.backend.dto.PendingUserResponse;
import com.ptdi.backend.dto.SetRoleRequest;
import com.ptdi.backend.dto.SetUnitRequest;
import com.ptdi.backend.entity.Role;
import com.ptdi.backend.entity.Unit;
import com.ptdi.backend.entity.User;
import com.ptdi.backend.exception.ApiException;
import com.ptdi.backend.repository.RoleRepository;
import com.ptdi.backend.repository.UnitRepository;
import com.ptdi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_AKTIF = "Aktif";
    private static final String STATUS_NONAKTIF = "Nonaktif";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UnitRepository unitRepository;

    @GetMapping("/pending")
    public List<PendingUserResponse> getPendingUsers() {
        return userRepository.findByStatus(STATUS_PENDING).stream()
                .map(u -> PendingUserResponse.builder()
                        .id(u.getUserId())
                        .nama(u.getNama())
                        .email(u.getEmail())
                        .nip(u.getNip())
                        .noHp(u.getNomorWhatsapp())
                        .unitKerja(u.getUnit() != null ? u.getUnit().getNamaUnit() : null)
                        .tanggalDaftar(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                        .role(u.getRole() != null ? u.getRole().getNamaRole() : null)
                        .build())
                .toList();
    }

    @GetMapping("/active")
    public List<ActiveUserResponse> getActiveUsers() {
        return userRepository.findByStatusIn(List.of(STATUS_AKTIF, STATUS_NONAKTIF)).stream()
                .map(u -> ActiveUserResponse.builder()
                        .id(u.getUserId())
                        .nama(u.getNama())
                        .email(u.getEmail())
                        .nip(u.getNip())
                        .noHp(u.getNomorWhatsapp())
                        .unitKerja(u.getUnit() != null ? u.getUnit().getNamaUnit() : null)
                        .role(u.getRole() != null ? u.getRole().getNamaRole() : null)
                        .aktif(STATUS_AKTIF.equals(u.getStatus()))
                        .build())
                .toList();
    }

    @PostMapping("/{id}/role")
    public ResponseEntity<Void> setRole(@PathVariable Integer id, @RequestBody SetRoleRequest request) {
        User user = findPendingUserOrThrow(id);
        Role role = resolveRoleOrThrow(request);
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/change-role")
    public ResponseEntity<Void> changeActiveUserRole(@PathVariable Integer id, @RequestBody SetRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User tidak ditemukan"));
        if (STATUS_PENDING.equals(user.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "User ini masih menunggu persetujuan, gunakan alur persetujuan pendaftaran");
        }
        Role role = resolveRoleOrThrow(request);
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/change-unit")
    public ResponseEntity<Void> changeUserUnit(@PathVariable Integer id, @RequestBody SetUnitRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User tidak ditemukan"));
        Unit unit = resolveUnitOrThrow(request);
        user.setUnit(unit);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Integer id) {
        User user = findPendingUserOrThrow(id);
        if (user.getRole() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tetapkan role terlebih dahulu sebelum mengaktifkan");
        }
        user.setStatus(STATUS_AKTIF);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Integer id) {
        User user = findPendingUserOrThrow(id);
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleStatus(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User tidak ditemukan"));
        if (STATUS_PENDING.equals(user.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "User ini masih menunggu persetujuan, belum bisa diaktifkan/nonaktifkan lewat sini");
        }
        user.setStatus(STATUS_AKTIF.equals(user.getStatus()) ? STATUS_NONAKTIF : STATUS_AKTIF);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/delete")
    public ResponseEntity<Void> deleteActiveUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User tidak ditemukan"));
        if (STATUS_PENDING.equals(user.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Gunakan aksi tolak untuk pendaftar yang masih menunggu persetujuan");
        }
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    private Role resolveRoleOrThrow(SetRoleRequest request) {
        if (!StringUtils.hasText(request.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role wajib diisi");
        }
        return roleRepository.findAll().stream()
                .filter(r -> r.getNamaRole().equalsIgnoreCase(request.getRole()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Role tidak dikenali"));
    }

    private Unit resolveUnitOrThrow(SetUnitRequest request) {
        if (!StringUtils.hasText(request.getUnitKerja())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja wajib diisi");
        }
        return unitRepository.findAll().stream()
                .filter(u -> u.getNamaUnit().equalsIgnoreCase(request.getUnitKerja()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unit kerja tidak dikenali"));
    }

    private User findPendingUserOrThrow(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User tidak ditemukan"));
        if (!STATUS_PENDING.equals(user.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User ini bukan pendaftar yang menunggu persetujuan");
        }
        return user;
    }
}
