package com.vitalarea.scheduler.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/login",
            "/settings",
            "/calendar",
            "/calendar/month",
            "/calendar/week",
            "/admin",
            "/admin/users",
            "/admin/audit-logs"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
