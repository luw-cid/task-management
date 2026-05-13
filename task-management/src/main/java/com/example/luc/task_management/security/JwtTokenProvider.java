package com.example.luc.task_management.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;

/**
 * JWT với jjwt 0.12.x: không dùng {@code Jwts.parserBuilder()} / {@code parseClaimsJws}
 * (đã bỏ); dùng {@code Jwts.parser().verifyWith(...).parseSignedClaims(...)}.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Getter
    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public String generateAccessToken(String email) {
        return buildToken(email, accessTokenExpiration);
    }

    public String generateRefreshToken(String email) {
        return buildToken(email, refreshTokenExpiration);
    }

    private String buildToken(String subject, long expirationMs) {
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

//    public long getRefreshTokenExpiration() {
//        return refreshTokenExpiration;
//    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.error("JWT token expired: {}", e.getMessage());
        } catch (UnsupportedJwtException | MalformedJwtException | IllegalArgumentException e) {
            log.error("JWT token invalid: {}", e.getMessage());
        } catch (JwtException e) {
            log.error("JWT error: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = decodeSecret(jwtSecret);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret phải cho key HS256 tối thiểu 32 bytes. "
                            + "Dùng Base64 (khuyến nghị) hoặc chuỗi UTF-8 đủ dài, hoặc hex đủ 64 ký tự."
            );
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private static byte[] decodeSecret(String secret) {
        if (secret == null) {
            return new byte[0];
        }
        String s = secret.trim();
        if (s.isEmpty()) {
            return new byte[0];
        }
        try {
            return Decoders.BASE64.decode(s);
        } catch (IllegalArgumentException ignored) {
            // không phải Base64 hợp lệ
        }
        if (s.matches("(?i)^[0-9a-f]+$") && (s.length() % 2 == 0)) {
            byte[] out = new byte[s.length() / 2];
            for (int i = 0; i < out.length; i++) {
                int hi = Character.digit(s.charAt(i * 2), 16);
                int lo = Character.digit(s.charAt(i * 2 + 1), 16);
                out[i] = (byte) ((hi << 4) + lo);
            }
            return out;
        }
        return s.getBytes(StandardCharsets.UTF_8);
    }
}
