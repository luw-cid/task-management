package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.ActivityLog;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {

    private Long id;
    private Long boardId;
    private Long taskId;
    private String taskTitle;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private String action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;

    public static ActivityLogResponse fromEntity(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .boardId(log.getBoard().getId())
                .taskId(log.getTask().getId())
                .taskTitle(log.getTask().getTitle())
                .userId(log.getUser().getId())
                .userFullName(log.getUser().getFullName())
                .userAvatarUrl(log.getUser().getAvatarUrl())
                .action(log.getAction().name())
                .fieldName(log.getFieldName())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
