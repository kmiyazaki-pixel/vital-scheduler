package com.vitalarea.scheduler.service;

import com.vitalarea.scheduler.dto.EventRequest;
import com.vitalarea.scheduler.dto.EventResponse;
import com.vitalarea.scheduler.entity.Calendar;
import com.vitalarea.scheduler.entity.Event;
import com.vitalarea.scheduler.repository.CalendarRepository;
import com.vitalarea.scheduler.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final CalendarRepository calendarRepository;
    private final AuditLogService auditLogService;

    public List<EventResponse> findByCalendarAndRange(Long calendarId, LocalDate from, LocalDate to) {
        OffsetDateTime fromAt = from.atStartOfDay().atOffset(ZoneOffset.ofHours(9));
        OffsetDateTime toAt = to.plusDays(1).atStartOfDay().minusSeconds(1).atOffset(ZoneOffset.ofHours(9));

        return eventRepository
                .findByCalendarIdAndEndAtGreaterThanEqualAndStartAtLessThanEqualOrderByStartAtAsc(calendarId, fromAt, toAt)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EventResponse create(EventRequest request) {
        validateDateRange(request);
        Calendar calendar = getCalendar(request.calendarId());

        Event event = new Event();
        apply(event, request, calendar);

        Event saved = eventRepository.save(event);

        auditLogService.log(
                "EVENT_CREATED",
                "event",
                saved.getId(),
                "{\"title\":\"" + escapeJson(saved.getTitle()) + "\",\"calendarId\":" + saved.getCalendar().getId() + "}"
        );

        return toResponse(saved);
    }

    public EventResponse update(Long eventId, EventRequest request) {
        validateDateRange(request);
        Calendar calendar = getCalendar(request.calendarId());

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("event not found"));

        apply(event, request, calendar);

        Event saved = eventRepository.save(event);

        auditLogService.log(
                "EVENT_UPDATED",
                "event",
                saved.getId(),
                "{\"title\":\"" + escapeJson(saved.getTitle()) + "\",\"calendarId\":" + saved.getCalendar().getId() + "}"
        );

        return toResponse(saved);
    }

    public void delete(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("event not found"));

        auditLogService.log(
                "EVENT_DELETED",
                "event",
                event.getId(),
                "{\"title\":\"" + escapeJson(event.getTitle()) + "\",\"calendarId\":" + event.getCalendar().getId() + "}"
        );

        eventRepository.delete(event);
    }

    private Calendar getCalendar(Long calendarId) {
        return calendarRepository.findById(calendarId)
                .filter(Calendar::isActive)
                .orElseThrow(() -> new IllegalArgumentException("calendar not found"));
    }

    private void validateDateRange(EventRequest request) {
        if (!request.endAt().isAfter(request.startAt())) {
            throw new IllegalArgumentException("endAt must be after startAt");
        }
    }

    private void apply(Event event, EventRequest request, Calendar calendar) {
        event.setCalendar(calendar);
        event.setTitle(request.title().trim());
        event.setCategory(request.category().trim().toLowerCase());
        event.setMemo(request.memo());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setAllDay(request.allDay());
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getCalendar().getId(),
                event.getTitle(),
                event.getCategory(),
                event.getMemo(),
                event.getStartAt(),
                event.getEndAt(),
                event.isAllDay()
        );
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}