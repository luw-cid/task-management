package com.example.luc.task_management.pattern.observer.comment;

import com.example.luc.task_management.entity.Comment;
import com.example.luc.task_management.entity.Notification;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.repository.NotificationRepository;
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

    // Thông báo cho những người liên quan khi có comment mới
    public void onCommentAdded(Comment comment) {
        List<User> usersToNotify = new ArrayList<>();

        // Thông báo cho assignee nếu có và không phải người comment
        if (comment.getTask().getAssignee() != null && comment.getTask().getAssignee().getId().equals(comment.getUser().getId())) {
            usersToNotify.add(comment.getTask().getReporter());
        }

        // Gửi thông báo cho từng người
        usersToNotify.forEach(user -> {
            Notification notification = Notification.builder()
                    .user(user)
                    .title("There are new comments")
                    .message(String.format("%s commented on %s's task", comment.getUser().getFullName(), comment.getTask().getTitle()))
                    .type(NotificationType.TASK_COMMENTED)
                    .referenceId(comment.getTask().getId())
                    .referenceType(ReferenceType.TASK)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.info("Comment notification sent to: {}", user.getEmail());
        });
    }
}
