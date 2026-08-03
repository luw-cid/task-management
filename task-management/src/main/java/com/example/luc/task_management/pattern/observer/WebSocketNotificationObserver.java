package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.service.NotificationService;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketNotificationObserver implements TaskObserver{

    private final WebSocketBroadcaster webSocketBroadcaster;
    private final NotificationService notificationService;

    @Override
    public void onTaskEven(Task task, String eventType, String message) {
        if (task.getAssignee() == null) return;
        if (task.getAssignee().getId().equals(task.getReporter().getId())) return;

        // 1. Lưu notification vào thông báo
        notificationService.sendNotification(
                task.getAssignee(),
                getTitle(eventType),
                message,
                getNotificationType(eventType),
                task.getId(),
                ReferenceType.TASK
        );

        // 2. Push real-time tới assignee qua WebSocket
        WebSocketMessage<String> wsMessage = WebSocketMessage.of(
                getWebSocketType(eventType),
                message,
                task.getBoard().getId(),
                task.getReporter().getEmail()
        );

        // Gửi tới user cụ thể
        webSocketBroadcaster.sendToUser(task.getAssignee().getEmail(), wsMessage);

        // Broadcast tới tất cả thành viên board
        webSocketBroadcaster.broadcastToBoard(task.getBoard().getId(), wsMessage);

        // Broadcast tới tất cả thành viên đang thực hiện task
        webSocketBroadcaster.broadcastToTask(task.getId(), wsMessage);
    }

    private String getTitle(String eventType) {
        return switch (eventType) {
            case "TASK_ASSIGNED" -> "You have been assigned to a new task.";
            case "TASK_UPDATED" -> "Your task has been updated.";
            case "TASK_MOVE" -> "Your task has been moved to a difference column.";
            default -> "New notification";
        };
    }

    private NotificationType getNotificationType (String eventType) {
        return switch (eventType) {
            case "TASK_ASSIGNED" -> NotificationType.TASK_ASSIGNED;
            case "TASK_UPDATED" -> NotificationType.TASK_UPDATE;
            default -> NotificationType.TASK_UPDATE;
        };
    }

    private WebSocketMessageType getWebSocketType(String eventType) {
        return switch (eventType) {
            case "TASK_ASSIGNED" -> WebSocketMessageType.TASK_ASSIGNED;
            case "TASK_UPDATED"  -> WebSocketMessageType.TASK_UPDATED;
            case "TASK_MOVED"    -> WebSocketMessageType.TASK_MOVED;
            default              -> WebSocketMessageType.TASK_UPDATED;
        };
    }
}
