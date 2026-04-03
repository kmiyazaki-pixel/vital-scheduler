package com.vitalarea.scheduler.config;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    private ResponseEntity<Resource> index() {
        Resource resource = new ClassPathResource("static/index.html");
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(resource);
    }

    @GetMapping("/")
    public ResponseEntity<Resource> root() {
        return index();
    }

    @GetMapping("/login")
    public ResponseEntity<Resource> login() {
        return index();
    }

    @GetMapping("/login/")
    public ResponseEntity<Resource> loginSlash() {
        return index();
    }

    @GetMapping("/settings")
    public ResponseEntity<Resource> settings() {
        return index();
    }

    @GetMapping("/settings/")
    public ResponseEntity<Resource> settingsSlash() {
        return index();
    }

    @GetMapping("/calendar")
    public ResponseEntity<Resource> calendar() {
        return index();
    }

    @GetMapping("/calendar/")
    public ResponseEntity<Resource> calendarSlash() {
        return index();
    }

    @GetMapping("/calendar/month")
    public ResponseEntity<Resource> calendarMonth() {
        return index();
    }

    @GetMapping("/calendar/month/")
    public ResponseEntity<Resource> calendarMonthSlash() {
        return index();
    }

    @GetMapping("/calendar/week")
    public ResponseEntity<Resource> calendarWeek() {
        return index();
    }

    @GetMapping("/calendar/week/")
    public ResponseEntity<Resource> calendarWeekSlash() {
        return index();
    }

    @GetMapping("/admin")
    public ResponseEntity<Resource> admin() {
        return index();
    }

    @GetMapping("/admin/")
    public ResponseEntity<Resource> adminSlash() {
        return index();
    }

    @GetMapping("/admin/users")
    public ResponseEntity<Resource> adminUsers() {
        return index();
    }

    @GetMapping("/admin/users/")
    public ResponseEntity<Resource> adminUsersSlash() {
        return index();
    }

    @GetMapping("/admin/audit-logs")
    public ResponseEntity<Resource> adminAuditLogs() {
        return index();
    }

    @GetMapping("/admin/audit-logs/")
    public ResponseEntity<Resource> adminAuditLogsSlash() {
        return index();
    }
}
