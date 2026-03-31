package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.EventRequest;
import com.vitalarea.scheduler.dto.EventResponse;
import com.vitalarea.scheduler.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @PostMapping
    public EventResponse create(@Valid @RequestBody EventRequest request) {
        return eventService.create(request);
    }

    @PutMapping("/{eventId}")
    public EventResponse update(@PathVariable Long eventId, @Valid @RequestBody EventRequest request) {
        return eventService.update(eventId, request);
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long eventId) {
        eventService.delete(eventId);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }
}
