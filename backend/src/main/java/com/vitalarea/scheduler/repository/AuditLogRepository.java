package com.vitalarea.scheduler.repository;

import com.vitalarea.scheduler.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}