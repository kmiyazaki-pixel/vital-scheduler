package com.vitalarea.scheduler.dto;

import java.time.OffsetDateTime;

public record EventResponse(
        Long id,
        Long calendarId,
        String title,
        String category,
        String memo,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        boolean allDay
) {
}
