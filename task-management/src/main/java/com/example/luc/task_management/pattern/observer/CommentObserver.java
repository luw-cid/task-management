package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.entity.mongo.Comment;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.repository.jpa.NotificationRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentObserver {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;

    // Thông báo cho những người liên quan khi có comment mới
    public void onCommentAdded(Comment comment) {
        if (comment.getTaskId() == null) return;

        Task task = taskRepository.findById(comment.getTaskId()).orElse(null);
        if (task == null) return;

        List<User> usersToNotify = new ArrayList<>();

        // Thông báo cho assignee nếu có và không phải người comment
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(comment.getUserId())) {
            usersToNotify.add(task.getAssignee());
        }

        // Thông báo cho reporter nếu có và không phải người comment
        if (task.getReporter() != null && !task.getReporter().getId().equals(comment.getUserId())) {
            usersToNotify.add(task.getReporter());
        }

        String message = String.format("%s commented on the task: %s", comment.getUserFullName(), task.getTitle());

        // Gửi thông báo cho từng người
        usersToNotify.forEach(user -> {
            notificationService.sendNotification(
                    user,
                    "Have a new comment.",
                    message,
                    NotificationType.TASK_COMMENTED,
                    task.getId(),
                    ReferenceType.TASK
            );
        });
    }
}
