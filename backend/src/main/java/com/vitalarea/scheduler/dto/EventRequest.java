package com.vitalarea.scheduler.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record EventRequest(
        @NotNull Long calendarId,
        @NotBlank String title,
        @NotBlank String category,
        String memo,
        @NotNull OffsetDateTime startAt,
        @NotNull OffsetDateTime endAt,
        boolean allDay
) {
}
