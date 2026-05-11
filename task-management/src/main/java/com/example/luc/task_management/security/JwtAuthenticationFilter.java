package com.example.luc.task_management.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
            try {
                // Bước 1: Lấy token từ header "Authorization: Bearer <token>"
                String token = extractToken(request);

                // Bước 2: Nếu token hợp lệ thì xác thực
                if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                    // Bước 3: Lấy email từ token
                    String email = jwtTokenProvider.getEmailFromToken(token);

                    // Bước 4: Load user từ DB
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                    // Bước 5: Tạo Authentication và lưu vào SecurityContext
                    // → Từ đây có thể gọi SecurityUtils.getCurrentUser() ở bất kỳ đâu
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                log.error("Lỗi xác thực: {}", e.getMessage());
            }
        // Bước 6: Cho request đi tiếp dù có token hay không
        filterChain.doFilter(request, response);
        }
    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return  bearer.substring(7);
        }
        return null;
    }
}
