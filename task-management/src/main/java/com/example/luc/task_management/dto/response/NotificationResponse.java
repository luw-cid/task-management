package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Notification;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String formattedId; // ví dụ: "N00001"
    private String title;
    private String message;
    private String type;
    private Long referenceId;
    private String referenceType;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .formattedId(IdFormatter.formatNotificationId(notification.getId()))
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType() != null ? notification.getReferenceType().name() : null)
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
