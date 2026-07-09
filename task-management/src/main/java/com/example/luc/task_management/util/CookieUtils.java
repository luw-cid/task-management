package com.example.luc.task_management.util;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtils {

    // Helper tạo Cookie chứa Refresh Token
    public ResponseCookie createRefreshTokenCookie(String refreshToken, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)                             // ngăn javascript truy cập vào cookie (chống XSS)
                .secure(true)                               // chỉ gửi qua HTTPS
                .path("/api/auth")                          // chỉ gửi cookie này khi call các endpoint của /auth
                .maxAge(maxAgeSeconds)                      // thời gian tương ứng với tham số maxAgeSeconds
                .sameSite("Strict")                         // chống tấn công CSRF bằng cách hạn chế gửi cookie từ trang web khác
                .build();
    }
}
