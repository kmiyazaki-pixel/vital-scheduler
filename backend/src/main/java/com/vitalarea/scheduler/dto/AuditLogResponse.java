package com.vitalarea.scheduler.dto;

import java.time.OffsetDateTime;

public record AuditLogResponse(
        Long id,
        Long userId,
        String action,
        String entityType,
        Long entityId,
        String detail,
        OffsetDateTime createdAt
) {
}