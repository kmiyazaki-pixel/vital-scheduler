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
        return "forward:/login.html";
    }

    @GetMapping("/settings")
    public String settings() {
        return "forward:/settings.html";
    }

    @GetMapping("/calendar")
    public String calendar() {
        return "forward:/calendar.html";
    }

    @GetMapping("/calendar/month")
    public String calendarMonth() {
        return "forward:/calendar/month.html";
    }

    @GetMapping("/calendar/week")
    public String calendarWeek() {
        return "forward:/calendar/week.html";
    }

    @GetMapping("/admin")
    public String admin() {
        return "forward:/admin.html";
    }

    @GetMapping("/admin/users")
    public String adminUsers() {
        return "forward:/admin/users.html";
    }

    @GetMapping("/admin/audit-logs")
    public String adminAuditLogs() {
        return "forward:/admin/audit-logs.html";
    }
}
