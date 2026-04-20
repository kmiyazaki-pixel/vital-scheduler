package com.vitalarea.scheduler.auth;

public record AuthMeResponse(
    String id,
    String email,
    String name
) {
}
