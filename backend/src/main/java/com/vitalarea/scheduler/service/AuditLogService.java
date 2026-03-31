package com.vitalarea.scheduler.service;

import com.vitalarea.scheduler.dto.AuditLogResponse;
import com.vitalarea.scheduler.entity.AuditLog;
import com.vitalarea.scheduler.repository.AuditLogRepository;
import com.vitalarea.scheduler.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String entityType, Long entityId, String detail) {
        AuditLog log = new AuditLog();
        log.setUserId(currentUserId());
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetail(detail);
        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> findAll() {
        return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getUserId(),
                        log.getAction(),
                        log.getEntityType(),
                        log.getEntityId(),
                        log.getDetail(),
                        log.getCreatedAt()
                ))
                .toList();
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser principal) {
            return principal.getId();
        }
        return null;
    }
}