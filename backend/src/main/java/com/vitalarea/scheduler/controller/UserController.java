package com.vitalarea.scheduler.controller;

import com.vitalarea.scheduler.dto.ChangePasswordRequest;
import com.vitalarea.scheduler.dto.CreateUserRequest;
import com.vitalarea.scheduler.dto.UpdateUserRequest;
import com.vitalarea.scheduler.dto.UserResponse;
import com.vitalarea.scheduler.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me() {
        return userService.findMe();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public UserResponse create(@RequestBody @Valid CreateUserRequest request) {
        return userService.create(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}")
    public UserResponse update(@PathVariable Long userId, @RequestBody @Valid UpdateUserRequest request) {
        return userService.update(userId, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userId}/status")
    public UserResponse updateStatus(@PathVariable Long userId, @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("active");
        if (active == null) {
            throw new IllegalArgumentException("active is required");
        }
        return userService.updateStatus(userId, active);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public Map<String, String> delete(@PathVariable Long userId) {
        userService.delete(userId);
        return Map.of("message", "ユーザーを削除しました");
    }

    @PostMapping("/me/password")
    public Map<String, String> changeMyPassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changeMyPassword(request.currentPassword(), request.newPassword());
        return Map.of("message", "パスワードを変更しました");
    }
}
