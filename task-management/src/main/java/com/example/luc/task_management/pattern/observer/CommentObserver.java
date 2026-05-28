package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.entity.Comment;
import com.example.luc.task_management.entity.Notification;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.repository.NotificationRepository;
import com.example.luc.task_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentObserver {

    // ★ SINGLETON PATTERN – dùng chung NotificationService
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    // Thông báo cho những người liên quan khi có comment mới
    public void onCommentAdded(Comment comment) {
        List<User> usersToNotify = new ArrayList<>();

        // Thông báo cho assignee nếu có và không phải người comment
        if (comment.getTask().getAssignee() != null && comment.getTask().getAssignee().getId().equals(comment.getUser().getId())) {
            usersToNotify.add(comment.getTask().getAssignee());
        }

        // Thông báo cho reported nếu có và không phải người comment
        if (!comment.getTask().getReporter().getId().equals(comment.getUser().getId())) {
            usersToNotify.add(comment.getTask().getReporter());
        }
        String message = String.format("%s commented on the task: %s", comment.getUser().getId(), comment.getTask().getTitle());

        // Gửi thông báo cho từng người
        usersToNotify.forEach(user -> {
            notificationService.sendNotification(
                    user,
                    "Have a new comment.",
                    message,
                    NotificationType.TASK_COMMENTED,
                    comment.getTask().getId(),
                    ReferenceType.TASK
            );
        });
    }
}
