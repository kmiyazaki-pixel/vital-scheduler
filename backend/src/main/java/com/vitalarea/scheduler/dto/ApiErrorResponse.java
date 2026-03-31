package com.vitalarea.scheduler.dto;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
        String message,
        OffsetDateTime timestamp
) {
}