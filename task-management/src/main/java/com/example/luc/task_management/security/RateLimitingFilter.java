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

    // Config tối đa 5 request trong 1p
    private static final int MAX_REQUEST_PER_MINUTE = 5;
    private static final long TIME_WINDOW_MS = 60000;

    // bộ nhớ RAM lưu trữ số lượng request theo từng ip
    private final ConcurrentHashMap<String, RequestCounter> ipRequestMap = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Bỏ qua các preflight request (OPTIONS) từ trình duyệt
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // chỉ áp dụng giới hạn cho API signup, signin
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            String ip = getClientIP(request);
            long currentTime = System.currentTimeMillis();
            RequestCounter currentCounter = ipRequestMap.get(ip);

            // Tính toán số lượng request của IP
            RequestCounter counter;
            if (currentCounter == null || currentTime - currentCounter.startTime > TIME_WINDOW_MS) {
                // Nếu IP này chưa từng gửi hoặc khoảng thời gian 1 phút trước đó đã qua -> Reset lại bộ đếm mới
                counter = new RequestCounter(currentTime, 1);
                ipRequestMap.put(ip, counter);
            } else {
                // Nếu vẫn đang trong 1p -> tăng bộ đếm
                currentCounter.count.incrementAndGet();
                counter = currentCounter;
            }
            // Kiểm tra xem có vượt quá giới hạn hay không
            if (counter.count.get() > MAX_REQUEST_PER_MINUTE) {
                log.warn("IP {} be blocked because send too many requests to API {}", ip, path);

                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");

                // Trả về JSON lỗi đồng bộ giống như cấu hình GlobalExceptionHandler
                String jsonResponse = "{"
                        + "\"status\": 429,"
                        + "\"message\": \"Too many login/register attempts. Please try again in 1 minute.\""
                        + "}";

                response.getWriter().write(jsonResponse);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    // Helper trích xuất IP của Client (Hỗ trợ khi deploy sau Proxy/Load Balancer như Nginx, Cloudflare)
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class RequestCounter {
        final long startTime;
        final AtomicInteger count;

        RequestCounter(long startTime, int count) {
            this.startTime = startTime;
            this.count = new AtomicInteger(count);
        }
    }
}
