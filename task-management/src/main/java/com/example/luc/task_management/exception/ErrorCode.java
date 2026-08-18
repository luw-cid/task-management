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

    // User
    WRONG_PASSWORD      (HttpStatus.BAD_REQUEST, "The current password is incorrect."),
    PASSWORD_NOT_MATCH  (HttpStatus.BAD_REQUEST, "Password confirmation does not match."),
    SAME_PASSWORD       (HttpStatus.BAD_REQUEST, "The new password must not be the same as the old password"),

    // Resource
    USER_NOT_FOUND      (HttpStatus.NOT_FOUND,     "User does not exists"),
    BOARD_NOT_FOUND     (HttpStatus.NOT_FOUND,     "Board does not exists"),
    COLUMN_NOT_FOUND    (HttpStatus.NOT_FOUND,     "Column does not exists"),
    TASK_NOT_FOUND      (HttpStatus.NOT_FOUND,     "Task does not exists"),

    BOARD_ARCHIVED(HttpStatus.BAD_REQUEST, "The board have been saved, the operation cannot be performed"),


    // Label
    LABEL_NOT_FOUND     (HttpStatus.NOT_FOUND,   "Label does not exists"),
    LABEL_ALREADY_EXISTS(HttpStatus.BAD_REQUEST,  "The label name already exists on the board"),
    LABEL_IN_USE        (HttpStatus.BAD_REQUEST,  "Label are being used by several tasks"),

    // Permission
    FORBIDDEN           (HttpStatus.FORBIDDEN,     "You aren't authorize to do this"),

    CANNOT_DELETE_LAST_COLUMN(HttpStatus.BAD_REQUEST, "Board must have at least one column"),

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
