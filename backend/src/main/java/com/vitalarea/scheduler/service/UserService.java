package com.vitalarea.scheduler.service;

import com.vitalarea.scheduler.dto.CreateUserRequest;
import com.vitalarea.scheduler.dto.UpdateUserRequest;
import com.vitalarea.scheduler.dto.UserResponse;
import com.vitalarea.scheduler.entity.Calendar;
import com.vitalarea.scheduler.entity.User;
import com.vitalarea.scheduler.repository.CalendarRepository;
import com.vitalarea.scheduler.repository.UserRepository;
import com.vitalarea.scheduler.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String COMPANY_DOMAIN = "@vital-area.com";

    private final UserRepository userRepository;
    private final CalendarRepository calendarRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public UserResponse findMe() {
        AuthenticatedUser principal = currentPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("user not found"));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String normalizedEmail = normalizeCompanyEmail(request.email());

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("このログインIDは既に使われています");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(normalizeRole(request.role()));
        user.setActive(true);
        user.setPasswordChangeRequired(true);

        User saved = userRepository.save(user);

        Calendar calendar = new Calendar();
        calendar.setName(saved.getName());
        calendar.setType("personal");
        calendar.setOwnerUserId(saved.getId());
        calendar.setActive(true);
        calendarRepository.save(calendar);

        auditLogService.log(
                "USER_CREATED",
                "user",
                saved.getId(),
                "{\"email\":\"" + escapeJson(saved.getEmail()) + "\",\"role\":\"" + saved.getRole() + "\"}"
        );

        return toResponse(saved);
    }

    @Transactional
    public UserResponse update(Long userId, UpdateUserRequest request) {
        User user = getUser(userId);
        String normalizedEmail = normalizeCompanyEmail(request.email());

        if (!user.getEmail().equalsIgnoreCase(normalizedEmail)
                && userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("このログインIDは既に使われています");
        }

        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setRole(normalizeRole(request.role()));
        user.setActive(request.active());

        User saved = userRepository.save(user);

        auditLogService.log(
                "USER_UPDATED",
                "user",
                saved.getId(),
                "{\"email\":\"" + escapeJson(saved.getEmail()) + "\",\"role\":\"" + saved.getRole() + "\",\"active\":" + saved.isActive() + "}"
        );

        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateStatus(Long userId, boolean active) {
        User user = getUser(userId);
        user.setActive(active);

        User saved = userRepository.save(user);

        auditLogService.log(
                "USER_STATUS_UPDATED",
                "user",
                saved.getId(),
                "{\"email\":\"" + escapeJson(saved.getEmail()) + "\",\"active\":" + saved.isActive() + "}"
        );

        return toResponse(saved);
    }

    @Transactional
    public void delete(Long userId) {
        AuthenticatedUser principal = currentPrincipal();

        if (principal.getId().equals(userId)) {
            throw new IllegalArgumentException("自分自身は削除できません");
        }

        User user = getUser(userId);

        if ("admin".equalsIgnoreCase(user.getRole()) && userRepository.countByRole("admin") <= 1) {
            throw new IllegalArgumentException("最後の管理者ユーザーは削除できません");
        }

        calendarRepository.deleteByOwnerUserId(userId);
        userRepository.delete(user);

        auditLogService.log(
                "USER_DELETED",
                "user",
                userId,
                "{\"email\":\"" + escapeJson(user.getEmail()) + "\",\"name\":\"" + escapeJson(user.getName()) + "\"}"
        );
    }

    @Transactional
    public void changeMyPassword(String currentPassword, String newPassword) {
        AuthenticatedUser principal = currentPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("user not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("現在のパスワードが違います");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("新しいパスワードを入力してください");
        }

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("新しいパスワードは8文字以上で入力してください");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangeRequired(false);
        userRepository.save(user);

        auditLogService.log(
                "PASSWORD_CHANGED",
                "user",
                user.getId(),
                "{\"email\":\"" + escapeJson(user.getEmail()) + "\"}"
        );
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

    private String normalizeRole(String rawRole) {
        String value = rawRole == null ? "" : rawRole.trim().toLowerCase();
        return "admin".equals(value) ? "admin" : "member";
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
    }

    private AuthenticatedUser currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new IllegalStateException("not authenticated");
        }
        return principal;
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.isPasswordChangeRequired()
        );
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
