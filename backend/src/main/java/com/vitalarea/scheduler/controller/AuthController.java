package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.LoginRequest;
import com.vitalarea.scheduler.dto.LoginResponse;
import com.vitalarea.scheduler.dto.UserResponse;
import com.vitalarea.scheduler.entity.User;
import com.vitalarea.scheduler.repository.UserRepository;
import com.vitalarea.scheduler.security.JwtService;
import com.vitalarea.scheduler.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
    private final JwtService jwtService;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            UserService userService,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "メールアドレスまたはパスワードが違います");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ユーザーが見つかりません"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "このユーザーは無効化されています");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        UserResponse response = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.isPasswordChangeRequired()
        );

        return new LoginResponse(token, response);
    }

    @PostMapping("/logout")
    public void logout() {
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.findMe();
    }
}
