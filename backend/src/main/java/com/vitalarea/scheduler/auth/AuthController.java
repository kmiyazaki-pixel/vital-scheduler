package com.vitalarea.scheduler.auth;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @GetMapping("/api/me")
    public ResponseEntity<AuthMeResponse> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }

        String id = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = extractName(jwt, email);

        return ResponseEntity.ok(new AuthMeResponse(id, email, name));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, String>> login() {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "ログインはTunag側から行ってください。"
        ));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of(
            "message", "ログアウトはTunag側から行ってください。"
        ));
    }

    private String extractName(Jwt jwt, String email) {
        Object userMetadataObj = jwt.getClaims().get("user_metadata");
        if (userMetadataObj instanceof Map<?, ?> userMetadata) {
            Object nameObj = userMetadata.get("name");
            if (nameObj instanceof String name && !name.isBlank()) {
                return name;
            }
        }

        if (email != null && !email.isBlank() && email.contains("@")) {
            return email.substring(0, email.indexOf("@"));
        }

        return "ユーザー";
    }
}
