package com.vitalarea.scheduler.dto;

public record UserResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean active,
        boolean passwordChangeRequired
) {
}