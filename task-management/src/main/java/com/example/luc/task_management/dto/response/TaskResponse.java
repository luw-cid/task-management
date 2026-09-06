package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private Long id;
    private String formattedId;  // ví dụ: "T00001"
    private String title;
    private String description;
    private String type;
    private String color;        // Màu từ Factory Pattern
    private String priority;
    private String status;
    private Long columnId;
    private String formattedColumnId; // ví dụ: "C00001"
    private String columnName;
    private Long boardId;
    private String formattedBoardId;  // ví dụ: "B00001"
    private Long assigneeId;
    private String formattedAssigneeId; // ví dụ: "U00001"
    private String assigneeName;
    private String assigneeAvatar;
    private Long reporterId;
    private String formattedReporterId; // ví dụ: "U00001"
    private String reporterName;
    private List<LabelResponse> labels;
    private int subtaskTotal;
    private int subtaskCompleted;
    private int completionPercentage;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;

    public static TaskResponse fromEntity(Task task, String color) {
        Long colId = task.getColumn() != null ? task.getColumn().getId() : null;
        Long bId = task.getBoard() != null ? task.getBoard().getId() : null;
        Long assId = task.getAssignee() != null ? task.getAssignee().getId() : null;
        Long repId = task.getReporter() != null ? task.getReporter().getId() : null;

        return TaskResponse.builder()
                .id(task.getId())
                .formattedId(IdFormatter.formatTaskId(task.getId()))
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType() != null ? task.getType().name() : "FEATURE")
                .color(color != null ? color : "#6366f1")
                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                .status(task.getStatus() != null ? task.getStatus().name() : "TO_DO")
                .columnId(colId)
                .formattedColumnId(IdFormatter.formatColumnId(colId))
                .columnName(task.getColumn() != null ? task.getColumn().getName() : null)
                .boardId(bId)
                .formattedBoardId(IdFormatter.formatBoardId(bId))
                .assigneeId(assId)
                .formattedAssigneeId(IdFormatter.formatUserId(assId))
                .assigneeName(task.getAssignee() != null
                        ? task.getAssignee().getFullName() : null)
                .assigneeAvatar(task.getAssignee() != null
                        ? task.getAssignee().getAvatarUrl() : null)
                .reporterId(repId)
                .formattedReporterId(IdFormatter.formatUserId(repId))
                .reporterName(task.getReporter() != null
                        ? task.getReporter().getFullName() : null)
                .labels(task.getLabels() != null ? task.getLabels().stream()
                        .map(LabelResponse::fromEntity)
                        .toList() : List.of())
                .subtaskTotal(task.getSubtasks() != null ? task.getSubtasks().size() : 0)
                .subtaskCompleted(task.getSubtasks() != null ? (int) task.getSubtasks().stream()
                        .filter(s -> Boolean.TRUE.equals(s.getIsCompleted())).count() : 0)
                .completionPercentage(task.getCompletionPercentage())
                .deadline(task.getDeadline())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .version(task.getVersion())
                .build();
    }
}
