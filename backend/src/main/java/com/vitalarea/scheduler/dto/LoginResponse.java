package com.vitalarea.scheduler.dto;

public record LoginResponse(
        String token,
        UserResponse user
) {
}
