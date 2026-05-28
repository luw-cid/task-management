package com.example.luc.task_management.dto.websocket;

public enum WebSocketMessageType {
    // Task events
    TASK_CREATED,
    TASK_UPDATED,
    TASK_MOVED,
    TASK_ASSIGNED,
    TASK_DELETED,

    // Comment events
    COMMENT_ADDED,
    COMMENT_UPDATED,
    COMMENT_DELETED,

    // Notification events
    NOTIFICATION_NEW,
    NOTIFICATION_READ,
    NOTIFICATION_READ_ALL,
    NOTIFICATION_COUNT_UPDATED,

    // Board events
    BOARD_MEMBER_INVITED,
    BOARD_MEMBER_REMOVED,

    // Column events
    COLUMN_CREATED,
    COLUMN_UPDATED,
    COLUMN_DELETED
}
