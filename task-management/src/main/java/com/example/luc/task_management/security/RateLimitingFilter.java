package com.example.luc.task_management.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Giới hạn Route Auth: Tối đa 5 lần thử trong 15 phút (900,000 ms)
    private static final int AUTH_MAX_ATTEMPTS = 5;
    private static final long AUTH_WINDOW_MS = 15 * 60 * 1000L; // 15 phút

    // Giới hạn Endpoints chung: Tối đa 100 request trong 1 phút (60,000 ms)
    private static final int GENERAL_MAX_REQUESTS = 100;
    private static final long GENERAL_WINDOW_MS = 60 * 1000L; // 1 phút

    // Bộ nhớ RAM lưu trữ số lượng request theo từng IP
    private final ConcurrentHashMap<String, RequestCounter> authRateMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestCounter> generalRateMap = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Bỏ qua các preflight request (OPTIONS) từ trình duyệt
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String ip = getClientIP(request);

        // 1. Áp dụng Rate Limiting chặt chẽ cho API Login & Register (Chặn Brute-Force)
        if (isAuthRoute(path)) {
            if (isRateLimited(authRateMap, ip, AUTH_MAX_ATTEMPTS, AUTH_WINDOW_MS)) {
                log.warn("IP {} bị khóa do vượt quá 5 lần thử đăng nhập/đăng ký trong 15 phút: {}", ip, path);
                sendRateLimitResponse(response, 429, "Too many authentication attempts. Maximum 5 attempts allowed per 15 minutes. Please try again later.");
                return;
            }
        } else if (path.startsWith("/api/")) {
            // 2. Áp dụng Rate Limiting chung cho tất cả API endpoints còn lại (Chặn Spam/DDoS)
            if (isRateLimited(generalRateMap, ip, GENERAL_MAX_REQUESTS, GENERAL_WINDOW_MS)) {
                log.warn("IP {} bị giới hạn do gửi quá nhiều request (>{}/min) tới API: {}", ip, GENERAL_MAX_REQUESTS, path);
                sendRateLimitResponse(response, 429, "Too many requests. Please slow down and try again in 1 minute.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthRoute(String path) {
        return path.endsWith("/auth/login") || path.endsWith("/auth/register")
                || path.contains("/auth/login") || path.contains("/auth/register");
    }

    private boolean isRateLimited(ConcurrentHashMap<String, RequestCounter> map, String ip, int maxRequests, long windowMs) {
        long currentTime = System.currentTimeMillis();

        RequestCounter counter = map.compute(ip, (key, existingCounter) -> {
            if (existingCounter == null || (currentTime - existingCounter.startTime > windowMs)) {
                return new RequestCounter(currentTime, 1);
            } else {
                existingCounter.count.incrementAndGet();
                return existingCounter;
            }
        });

        return counter.count.get() > maxRequests;
    }

    private void sendRateLimitResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = String.format("{\"status\": %d, \"message\": \"%s\"}", status, message);
        response.getWriter().write(jsonResponse);
    }

    // Helper trích xuất IP của Client (Hỗ trợ proxy/load balancer như Nginx, Cloudflare)
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RequestCounter {
        final long startTime;
        final AtomicInteger count;

        RequestCounter(long startTime, int initialCount) {
            this.startTime = startTime;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
