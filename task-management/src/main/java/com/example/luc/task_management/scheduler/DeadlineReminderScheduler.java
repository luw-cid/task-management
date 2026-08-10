package com.example.luc.task_management.scheduler;


import com.example.luc.task_management.dto.response.NotificationResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mysql.Notification;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.repository.jpa.NotificationRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineReminderScheduler {
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final WebSocketBroadcaster webSocketBroadcaster;

    @Scheduled(fixedRate = 900000)
    @Transactional
    public void checkAndSendDeadlineReminder() {
        LocalDateTime now = LocalDateTime.now();

        // quét các task có deadline trong 24h tiếp theo
        LocalDateTime upcoming24h = now.plusHours(24);

        List<Task> upcomingTasks = taskRepository.findTasksUpcomingDeadline(now, upcoming24h);

        if (upcomingTasks.isEmpty()) return;

        log.info("⏰ [DeadlineScheduler] Found {} tasks due soon", upcomingTasks.size());

        for(Task task: upcomingTasks) {
            long hoursRemaining = Duration.between(now, task.getDeadline()).toHours();
            String timeText = hoursRemaining > 0 ? hoursRemaining + "hour" : "a few minutes";

            String title = "Work reminder!";
            String message = String.format("The task '%s on the board '%s' will expire in '%s'",
                    task.getTitle(),
                    task.getBoard().getName(),
                    timeText
                    );

            // 1. Tạo bản ghi Notification trong Database
            Notification notification = Notification.builder()
                    .user(task.getAssignee())
                    .title(task.getTitle())
                    .message(message)
                    .type(NotificationType.DEADLINE_REMINDER)
                    .referenceId(task.getId())
                    .referenceType(ReferenceType.TASK)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);

            // 2. Gửi thông báo đẩy thời gian thực qua WebSocket đến Frontend
            WebSocketMessage<NotificationResponse> wsMessage = WebSocketMessage.of(
                    WebSocketMessageType.SYSTEM_ALERT,
                    NotificationResponse.fromEntity(notification),
                    task.getBoard().getId(),
                    "SYSTEM"
            );
            webSocketBroadcaster.broadcastToBoard(task.getBoard().getId(), wsMessage);
            log.info("📢 Deadline reminder send to the user '{}' (Task: {})",
                    task.getAssignee().getEmail(), task.getTitle());
        }
    }
}
