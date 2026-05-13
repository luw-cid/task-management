package com.example.luc.task_management.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    EMAIL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST,   "Email already exists"),
    INVALID_CREDENTIALS (HttpStatus.UNAUTHORIZED,  "Incorrect email or password"),
    INVALID_TOKEN       (HttpStatus.UNAUTHORIZED,  "Invalid token"),
    TOKEN_EXPIRED       (HttpStatus.UNAUTHORIZED,  "Token has expired"),
    UNAUTHORIZED        (HttpStatus.UNAUTHORIZED,  "You are not login in yet"),

    // Resource
    USER_NOT_FOUND      (HttpStatus.NOT_FOUND,     "User does not exists"),
    BOARD_NOT_FOUND     (HttpStatus.NOT_FOUND,     "Board does not exists"),
    COLUMN_NOT_FOUND    (HttpStatus.NOT_FOUND,     "Column does not exists"),
    TASK_NOT_FOUND      (HttpStatus.NOT_FOUND,     "Task does not exists"),

    // Permission
    FORBIDDEN           (HttpStatus.FORBIDDEN,     "You aren't authorize to do this"),

    // Common
    BAD_REQUEST         (HttpStatus.BAD_REQUEST,   "Invalid request"),
    INTERNAL_ERROR      (HttpStatus.INTERNAL_SERVER_ERROR, "System error");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
