package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.ActivityLog;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponse {

    private Long id;
    private String formattedId;      // ví dụ: "AL00001"
    private Long boardId;
    private String formattedBoardId; // ví dụ: "B00001"
    private Long taskId;
    private String formattedTaskId;  // ví dụ: "T00001"
    private String taskTitle;
    private Long userId;
    private String formattedUserId;  // ví dụ: "U00001"
    private String userFullName;
    private String userAvatarUrl;
    private String action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;

    public static ActivityLogResponse fromEntity(ActivityLog log) {
        Long bId = log.getBoard() != null ? log.getBoard().getId() : null;
        Long tId = log.getTask() != null ? log.getTask().getId() : null;
        String tTitle = log.getTask() != null ? log.getTask().getTitle() : null;
        Long uId = log.getUser() != null ? log.getUser().getId() : null;
        String uName = log.getUser() != null ? log.getUser().getFullName() : null;
        String uAvatar = log.getUser() != null ? log.getUser().getAvatarUrl() : null;

        return ActivityLogResponse.builder()
                .id(log.getId())
                .formattedId(IdFormatter.formatActivityLogId(log.getId()))
                .boardId(bId)
                .formattedBoardId(IdFormatter.formatBoardId(bId))
                .taskId(tId)
                .formattedTaskId(IdFormatter.formatTaskId(tId))
                .taskTitle(tTitle)
                .userId(uId)
                .formattedUserId(IdFormatter.formatUserId(uId))
                .userFullName(uName)
                .userAvatarUrl(uAvatar)
                .action(log.getAction() != null ? log.getAction().name() : null)
                .fieldName(log.getFieldName())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
