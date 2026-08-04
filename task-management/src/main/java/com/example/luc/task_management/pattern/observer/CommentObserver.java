package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.entity.mongo.Comment;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentObserver {

    private final NotificationService notificationService;

    // Thông báo bất đồng bộ (@Async) cho người liên quan khi có comment mới
    @Async
    public void onCommentAdded(Task task, Comment comment) {
        if (task == null || comment == null) return;

        List<User> usersToNotify = new ArrayList<>();

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(comment.getUserId())) {
            usersToNotify.add(task.getAssignee());
        }

        if (task.getReporter() != null && !task.getReporter().getId().equals(comment.getUserId())) {
            usersToNotify.add(task.getReporter());
        }

        String message = String.format("%s commented on the task: %s", comment.getUserFullName(), task.getTitle());

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
