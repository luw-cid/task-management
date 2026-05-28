package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.entity.Notification;
import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.repository.NotificationRepository;
import com.example.luc.task_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InAppNotificationObserver implements TaskObserver{

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Override
    public void onTaskEven(Task task, String evenType, String message) {
        // Chỉ gửi thông báo nếu có assignee
        if (task.getAssignee() != null) return;
        // không gửi thông báo cho người thực hiện
        if (task.getAssignee().getId().equals(task.getReporter().getId())) return;

        notificationService.sendNotification(
                task.getAssignee(),
                getTitle(evenType),
                message,
                getNotificationType(evenType),
                task.getId(),
                ReferenceType.TASK
        );
        log.info("Notification saved for user: {}", task.getAssignee().getEmail());
    }

    private String getTitle(String evenType) {
        return switch (evenType) {
            case "TASK_ASSIGNED" -> "You have been assigned to a new task";
            case "TASK_UPDATE" -> "Your task have been updated";
            case "TASK_MOVE" -> "Your task have been moved to a new column";
            default -> "New notification";
        };
    }

    private NotificationType getNotificationType(String evenType) {
        return switch (evenType) {
            case "TASK_ASSIGNED" -> NotificationType.TASK_ASSIGNED;
            case "TASK_UPDATE" -> NotificationType.TASK_UPDATE;
            default -> NotificationType.TASK_UPDATE;
        };
    }
}
