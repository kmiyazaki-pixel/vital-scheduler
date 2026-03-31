package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.AuthResponse;
import com.vitalarea.scheduler.dto.LoginRequest;
import com.vitalarea.scheduler.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final String COMPANY_DOMAIN = "@vital-area.com";

    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = normalizeCompanyEmail(request.email());

        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(normalizedEmail, request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        return ResponseEntity.ok(new AuthResponse("logged in", userService.findMe()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "logged out"));
    }

    private String normalizeCompanyEmail(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("ログインIDを入力してください");
        }

        String value = raw.trim().toLowerCase();

        if (value.isEmpty()) {
            throw new IllegalArgumentException("ログインIDを入力してください");
        }

        if (!value.contains("@")) {
            return value + COMPANY_DOMAIN;
        }

        if (!value.endsWith(COMPANY_DOMAIN)) {
            throw new IllegalArgumentException("vital-area.com のメールアドレスのみ利用できます");
        }

        String localPart = value.substring(0, value.indexOf('@')).trim();
        if (localPart.isEmpty()) {
            throw new IllegalArgumentException("ログインIDを入力してください");
        }

        return value;
    }
}