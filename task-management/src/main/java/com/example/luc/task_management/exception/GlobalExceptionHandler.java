package com.example.luc.task_management.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /// Bắt lỗi validate @valid - VD: email sai định dạng, password quá ngắn
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            errors.put(field, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "message", "Invalid data",
                "errors", errors
        ));
    }

    // Lỗi business logic – VD: email đã tồn tại, sai mật khẩu
    @ExceptionHandler(AppException.class)
    public ResponseEntity<Map<String, Object>> handleAppException(AppException ex) {
        log.error("AppException: {}", ex.getMessage());
        return ResponseEntity
                .status(ex.getErrorCode().getHttpStatus())
                .body(Map.of(
                        "status", ex.getErrorCode().getHttpStatus().value(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler({org.springframework.security.access.AccessDeniedException.class, org.springframework.security.core.AuthenticationException.class})
    public ResponseEntity<Map<String, Object>> handleSecurityException(Exception ex) {
        log.error("Security exception: {}", ex.getMessage());
        return ResponseEntity.status(401).body(Map.of(
                "status", 401,
                "message", "Unauthorized access"
        ));
    }

    // Lỗi không mong đợi – VD: NullPointerException, SQLException
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.internalServerError().body(Map.of(
                "status", 500,
                "message", "System error, please try again later"
        ));
    }

    // Bắt lỗi cú pháp json không hợp lệ hoặc giá trị ENUM sai định dạng
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.error("HttpMessageReadable: {}", ex.getMessage());

        String errorMessage = "Invalid input data or incorrect format";

        return ResponseEntity.badRequest().body(Map.of(
                "status",400,
                "message", errorMessage
        ));
    }
}
