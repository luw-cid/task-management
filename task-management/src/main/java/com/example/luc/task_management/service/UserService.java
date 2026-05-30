package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.profile.ChangePasswordRequest;
import com.example.luc.task_management.dto.request.profile.UpdateProfileRequest;
import com.example.luc.task_management.dto.response.UserProfileResponse;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.UserRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile() {
        User currentUser = SecurityUtils.getCurrentUser();
        return UserProfileResponse.fromEntity(currentUser);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        if (request.getFullName() != null) {
            currentUser.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            currentUser.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(currentUser);
        log.info("Profile updated: {}", currentUser.getEmail());

        return UserProfileResponse.fromEntity(currentUser);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        // Kiểm tra xác nhận mật khẩu
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        // Kiểm tra mật khẩu mới không trùng cũ
        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPassword())) {
            throw new AppException(ErrorCode.SAME_PASSWORD);
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
        log.info("Password changed: {}", currentUser.getEmail());
    }

    @Transactional
    public UserProfileResponse removeAvatar() {
        User currentUser = SecurityUtils.getCurrentUser();
        currentUser.setAvatarUrl(null);
        userRepository.save(currentUser);
        return UserProfileResponse.fromEntity(currentUser);
    }

    // Vô hiệu hóa tk
    @Transactional
    public void deactivateAccount() {
        User currentUser = SecurityUtils.getCurrentUser();
        currentUser.setIsActive(false);
        userRepository.save(currentUser);
        log.info("Account deactivated: {}", currentUser.getEmail());
    }
}
