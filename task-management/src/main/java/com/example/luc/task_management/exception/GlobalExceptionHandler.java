package com.example.luc.task_management.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
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
                "message", "Dữ liệu không hợp lệ",
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

    // Lỗi không mong đợi – VD: NullPointerException, SQLException
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.internalServerError().body(Map.of(
                "status", 500,
                "message", "Lỗi hệ thống, vui lòng thử lại sau"
        ));
    }
}
