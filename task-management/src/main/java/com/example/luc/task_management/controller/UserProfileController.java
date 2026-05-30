package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.profile.ChangePasswordRequest;
import com.example.luc.task_management.dto.request.profile.UpdateProfileRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.UserProfileResponse;
import com.example.luc.task_management.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@Tag(name = "User", description = "Manage user profile")
public class UserProfileController {

    private final UserService userService;

    @Operation(summary = "Get my profile")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyProfile()));
    }

    @Operation(summary = "Get user profile by ID")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(userId)));
    }

    @Operation(summary = "Update profile")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile (
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(request)));
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Changed password successfully", null));
    }

    @Operation(summary = "Delete avatar")
    @DeleteMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserProfileResponse>> removeAvatar() {
        return ResponseEntity.ok(
                ApiResponse.success("Avatar removed successfully", userService.removeAvatar())
        );
    }

    @Operation(summary = "Disable account")
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount() {
        userService.deactivateAccount();
        return ResponseEntity.ok(ApiResponse.success("The account has been disabled.", null));
    }
}
