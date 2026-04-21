package com.vitalarea.scheduler.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        String email = jwt.getClaimAsString("email");

        String name = "ユーザー";
        Object meta = jwt.getClaims().get("user_metadata");
        if (meta instanceof Map<?, ?> map) {
            Object nameObj = map.get("name");
            if (nameObj instanceof String s && !s.isBlank()) {
                name = s;
            }
        }

        return ResponseEntity.ok(Map.of(
            "id", jwt.getSubject(),
            "email", email,
            "name", name
        ));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login() {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "ログインはTunagから行ってください"
        ));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of(
            "message", "ログアウトはTunagから行ってください"
        ));
    }
}
