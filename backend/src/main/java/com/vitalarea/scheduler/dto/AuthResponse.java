package com.vitalarea.scheduler.dto;

public record AuthResponse(
        String message,
        UserResponse user
) {
}
