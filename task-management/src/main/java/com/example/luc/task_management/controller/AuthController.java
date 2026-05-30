package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.auth.LoginRequest;
import com.example.luc.task_management.dto.request.auth.RegisterRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.AuthResponse;
import com.example.luc.task_management.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, refresh token")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register new account")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(authService.register(request)));
    }

    @Operation(summary = "Login")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successfully", authService.login(request)));
    }

    @Operation(summary = "Logout")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout (
            @RequestParam String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Logout successfully", null));
    }
}
