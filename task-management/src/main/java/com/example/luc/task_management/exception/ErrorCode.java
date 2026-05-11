package com.example.luc.task_management.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    EMAIL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST,   "Email đã tồn tại"),
    INVALID_CREDENTIALS (HttpStatus.UNAUTHORIZED,  "Email hoặc mật khẩu không đúng"),
    INVALID_TOKEN       (HttpStatus.UNAUTHORIZED,  "Token không hợp lệ"),
    TOKEN_EXPIRED       (HttpStatus.UNAUTHORIZED,  "Token đã hết hạn"),
    UNAUTHORIZED        (HttpStatus.UNAUTHORIZED,  "Bạn chưa đăng nhập"),

    // Resource
    USER_NOT_FOUND      (HttpStatus.NOT_FOUND,     "Người dùng không tồn tại"),
    BOARD_NOT_FOUND     (HttpStatus.NOT_FOUND,     "Board không tồn tại"),
    COLUMN_NOT_FOUND    (HttpStatus.NOT_FOUND,     "Column không tồn tại"),
    TASK_NOT_FOUND      (HttpStatus.NOT_FOUND,     "Task không tồn tại"),

    // Permission
    FORBIDDEN           (HttpStatus.FORBIDDEN,     "Bạn không có quyền thực hiện"),

    // Common
    BAD_REQUEST         (HttpStatus.BAD_REQUEST,   "Yêu cầu không hợp lệ"),
    INTERNAL_ERROR      (HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
