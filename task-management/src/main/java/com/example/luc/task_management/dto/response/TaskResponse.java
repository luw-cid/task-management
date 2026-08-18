package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Task;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private String type;
    private String color;        // Màu từ Factory Pattern
    private String priority;
    private String status;
    private Long columnId;
    private String columnName;
    private Long boardId;
    private Long assigneeId;
    private String assigneeName;
    private String assigneeAvatar;
    private Long reporterId;
    private String reporterName;
    private List<LabelResponse> labels;
    private int subtaskTotal;
    private int subtaskCompleted;
    private int completionPercentage;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse fromEntity(Task task, String color) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType() != null ? task.getType().name() : "FEATURE")
                .color(color != null ? color : "#6366f1")
                .priority(task.getPriority() != null ? task.getPriority().name() : "MEDIUM")
                .status(task.getStatus() != null ? task.getStatus().name() : "TO_DO")
                .columnId(task.getColumn() != null ? task.getColumn().getId() : null)
                .columnName(task.getColumn() != null ? task.getColumn().getName() : null)
                .boardId(task.getBoard() != null ? task.getBoard().getId() : null)
                .assigneeId(task.getAssignee() != null
                        ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null
                        ? task.getAssignee().getFullName() : null)
                .assigneeAvatar(task.getAssignee() != null
                        ? task.getAssignee().getAvatarUrl() : null)
                .reporterId(task.getReporter() != null
                        ? task.getReporter().getId() : null)
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
                .build();
    }
}
