package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.CalendarResponse;
import com.vitalarea.scheduler.dto.EventResponse;
import com.vitalarea.scheduler.service.CalendarService;
import com.vitalarea.scheduler.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendars")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarService calendarService;
    private final EventService eventService;

    @GetMapping
    public List<CalendarResponse> calendars() {
        return calendarService.findAll();
    }

    @GetMapping("/{calendarId}/events")
    public List<EventResponse> events(
            @PathVariable Long calendarId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return eventService.findByCalendarAndRange(calendarId, from, to);
    }
}
