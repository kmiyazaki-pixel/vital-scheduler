package com.vitalarea.scheduler.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/{path:^(?!api$)(?!_next$)[^.]*}",
            "/{path:^(?!api$)(?!_next$).*$}/**/{subpath:[^.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
