package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.AuditLogResponse;
import com.vitalarea.scheduler.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AuditLogResponse> findAll() {
        return auditLogService.findAll();
    }
}