package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.LoginRequest;
import com.vitalarea.scheduler.dto.UserResponse;
import com.vitalarea.scheduler.entity.User;
import com.vitalarea.scheduler.repository.UserRepository;
import com.vitalarea.scheduler.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserService userService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            UserService userService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "このユーザーは無効化されています");
        }

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.isPasswordChangeRequired()
        );
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.findMe();
    }
}
