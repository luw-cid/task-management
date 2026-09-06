package com.example.luc.task_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Giới hạn Route Auth: Tối đa 5 lần thử trong 15 phút (900 giây)
    private static final int AUTH_MAX_ATTEMPTS = 5;
    private static final long AUTH_WINDOW_SECONDS = 15 * 60L;

    // Giới hạn Endpoints chung: Tối đa 100 request trong 1 phút (60 giây)
    private static final int GENERAL_MAX_REQUESTS = 100;
    private static final long GENERAL_WINDOW_SECONDS = 60L;

    private final StringRedisTemplate redisTemplate;

    // Bộ nhớ RAM Fallback phòng khi Redis tạm thời mất kết nối
    private final ConcurrentHashMap<String, RequestCounter> authFallbackMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestCounter> generalFallbackMap = new ConcurrentHashMap<>();

    public RateLimitingFilter(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

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

        RateLimitResult result = null;

        // 1. Áp dụng Rate Limiting chặt chẽ cho API Login & Register (Chặn Brute-Force)
        if (isAuthRoute(path)) {
            result = checkRateLimit("auth", authFallbackMap, ip, AUTH_MAX_ATTEMPTS, AUTH_WINDOW_SECONDS);
            if (result.isBlocked()) {
                log.warn("IP {} bị khóa do vượt quá {} lần thử đăng nhập/đăng ký trong {}s: {}",
                        ip, AUTH_MAX_ATTEMPTS, AUTH_WINDOW_SECONDS, path);
                sendRateLimitResponse(response, result,
                        "Too many authentication attempts. Maximum 5 attempts allowed per 15 minutes. Please try again later.");
                return;
            }
        } else if (path.startsWith("/api/")) {
            // 2. Áp dụng Rate Limiting chung cho tất cả API endpoints còn lại (Chặn Spam/DDoS)
            result = checkRateLimit("general", generalFallbackMap, ip, GENERAL_MAX_REQUESTS, GENERAL_WINDOW_SECONDS);
            if (result.isBlocked()) {
                log.warn("IP {} bị giới hạn do gửi quá nhiều request (>{}/min) tới API: {}",
                        ip, GENERAL_MAX_REQUESTS, path);
                sendRateLimitResponse(response, result,
                        "Too many requests. Please slow down and try again in 1 minute.");
                return;
            }
        }

        if (result != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthRoute(String path) {
        return path.endsWith("/auth/login") || path.endsWith("/auth/register")
                || path.contains("/auth/login") || path.contains("/auth/register");
    }

    private RateLimitResult checkRateLimit(String prefix, ConcurrentHashMap<String, RequestCounter> fallbackMap,
                                          String ip, int maxRequests, long windowSeconds) {
        if (redisTemplate != null) {
            try {
                String key = "rate_limit:" + prefix + ":" + ip;
                Long current = redisTemplate.opsForValue().increment(key);

                if (current != null && current == 1) {
                    redisTemplate.expire(key, Duration.ofSeconds(windowSeconds));
                }

                Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                long retryAfter = (ttl != null && ttl > 0) ? ttl : windowSeconds;
                long count = (current != null) ? current : 1;
                long remaining = Math.max(0, maxRequests - count);
                boolean isBlocked = count > maxRequests;

                return new RateLimitResult(isBlocked, maxRequests, remaining, retryAfter);
            } catch (Exception e) {
                log.warn("Redis rate limiter unavailable, falling back to in-memory: {}", e.getMessage());
            }
        }

        // Fallback sang in-memory ConcurrentHashMap
        return checkInMemoryRateLimit(fallbackMap, ip, maxRequests, windowSeconds * 1000L);
    }

    private RateLimitResult checkInMemoryRateLimit(ConcurrentHashMap<String, RequestCounter> map,
                                                   String ip, int maxRequests, long windowMs) {
        long currentTime = System.currentTimeMillis();

        RequestCounter counter = map.compute(ip, (key, existingCounter) -> {
            if (existingCounter == null || (currentTime - existingCounter.startTime > windowMs)) {
                return new RequestCounter(currentTime, 1);
            } else {
                existingCounter.count.incrementAndGet();
                return existingCounter;
            }
        });

        int currentCount = counter.count.get();
        long remainingMs = Math.max(0, (counter.startTime + windowMs) - currentTime);
        long retryAfterSeconds = Math.max(1, remainingMs / 1000L);
        long remaining = Math.max(0, maxRequests - currentCount);
        boolean isBlocked = currentCount > maxRequests;

        return new RateLimitResult(isBlocked, maxRequests, remaining, retryAfterSeconds);
    }

    private void sendRateLimitResponse(HttpServletResponse response, RateLimitResult result, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", "0");

        String jsonResponse = String.format("{\"status\": 429, \"message\": \"%s\"}", message);
        response.getWriter().write(jsonResponse);
    }

    // Helper trích xuất IP của Client (Hỗ trợ proxy/load balancer như Cloudflare, Google Cloud Load Balancer)
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class RateLimitResult {
        private final boolean blocked;
        private final int limit;
        private final long remaining;
        private final long retryAfterSeconds;
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
