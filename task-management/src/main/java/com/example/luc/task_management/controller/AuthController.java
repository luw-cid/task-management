package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.LoginRequest;
import com.example.luc.task_management.dto.request.RegisterRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.AuthResponse;
import com.example.luc.task_management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successfully", authService.login(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout (
            @RequestParam String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Logout successfully", null));
    }
}
