package com.vitalarea.scheduler.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping("/")
    public String root() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/index.html";
    }

    @GetMapping("/calendar")
    public String calendar() {
        return "forward:/index.html";
    }

    @GetMapping("/calendar/month")
    public String calendarMonth() {
        return "forward:/index.html";
    }

    @GetMapping("/calendar/week")
    public String calendarWeek() {
        return "forward:/index.html";
    }

    @GetMapping("/settings")
    public String settings() {
        return "forward:/index.html";
    }

    @GetMapping("/admin")
    public String admin() {
        return "forward:/index.html";
    }

    @GetMapping("/admin/users")
    public String adminUsers() {
        return "forward:/index.html";
    }

    @GetMapping("/admin/audit-logs")
    public String adminAuditLogs() {
        return "forward:/index.html";
    }
}
