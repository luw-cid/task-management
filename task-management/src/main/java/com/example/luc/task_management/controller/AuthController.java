package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.auth.LoginRequest;
import com.example.luc.task_management.dto.request.auth.RegisterRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.AuthResponse;
import com.example.luc.task_management.service.AuthService;
import com.example.luc.task_management.util.CookieUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, refresh token")
public class AuthController {

    private final AuthService authService;

    private final CookieUtils cookieUtils;

    @Operation(summary = "Register new account")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.register(request);

        // 1. Tạo cookie chứa refresh Token
        ResponseCookie cookie = cookieUtils.createRefreshTokenCookie(authResponse.getRefreshToken(), 7 * 24 * 60 * 60);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 2. Xoa Refresh Token trong Response body để không gửi về Client dạng thô
        authResponse.setRefreshToken(null);

        return ResponseEntity.status(201).body(ApiResponse.created(authResponse));
    }

    @Operation(summary = "Login")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);

        // 1. Tạo cookie chứa refresh Token
        ResponseCookie cookie = cookieUtils.createRefreshTokenCookie(authResponse.getRefreshToken(), 7 * 24 * 60 * 60);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 2. Xóa refresh token trong response body để không gửi về Client dạng thô
        authResponse.setRefreshToken(null);

        return ResponseEntity.ok(ApiResponse.success("Login successfully", authResponse));
    }

    @Operation(summary = "Refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.status(401).body(ApiResponse.success("No refresh token cookie found", null));
        }

        AuthResponse authResponse = authService.refreshToken(refreshToken);

        // Ghi đè lại cookie chứa refresh token mới (luân chuyển token)
        ResponseCookie cookie = cookieUtils.createRefreshTokenCookie(authResponse.getRefreshToken(), 7 * 24 * 60 * 60);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        authResponse.setRefreshToken(null);

        return ResponseEntity.ok(ApiResponse.success("Refresh token successfully", authResponse));
    }

    @Operation(summary = "Logout")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout (
            @CookieValue(name = "refreshToken",required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        // Ghi đè cookie trống với maxAgeSeconds = 0 để yêu cầu browser xóa cookie
        ResponseCookie cookie = cookieUtils.createRefreshTokenCookie("", 0);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(ApiResponse.success("Logout successfully", null));
    }
}
