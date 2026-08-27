package com.ptdi.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_trail_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditTrailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Polymorphic reference (entity_type + entity_id) — deliberately NOT a JPA
     * relationship: generic change-logging can point at any table, so there is
     * no single target to model as a real FK constraint.
     */
    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Integer entityId;

    @Column(name = "aksi")
    private String aksi;

    @Column(name = "nilai_lama", columnDefinition = "TEXT")
    private String nilaiLama;

    @Column(name = "nilai_baru", columnDefinition = "TEXT")
    private String nilaiBaru;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
