package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.auth.LoginRequest;
import com.example.luc.task_management.dto.request.auth.RegisterRequest;
import com.example.luc.task_management.dto.response.AuthResponse;
import com.example.luc.task_management.entity.mysql.RefreshToken;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.SystemRole;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.RefreshTokenRepository;
import com.example.luc.task_management.repository.jpa.UserRepository;
import com.example.luc.task_management.security.JwtTokenProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException((ErrorCode.EMAIL_ALREADY_EXISTS));
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(SystemRole.USER)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("Register successfully: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            // Xác thực email + password
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            ));
        } catch(BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        // Lấy user từ db
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Xóa refresh token để tránh tích lũy trong db -> tốn dung lượng
        refreshTokenRepository.deleteAllByUser(user);

        log.info("Login successfully: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {

        // 1. Kiểm tra token có hợp lệ không
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        // 2. Tìm token trong DB
        RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        // 3. Kiểm tra hết hạn
        if (stored.getExpiredAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        // 4. Xóa token cũ, tạo mới
        User user = stored.getUser();
        refreshTokenRepository.delete(stored);

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    // ─────────────────────────────────────────
    // HELPER – Tạo AccessToken + RefreshToken
    // ─────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Lưu refresh token vào DB
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiredAt(LocalDateTime.now().plusSeconds(
                        jwtTokenProvider.getRefreshTokenExpiration() / 1000
                ))
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(AuthResponse.UserInfo.fromEntity(user))
                .build();
    }
}
