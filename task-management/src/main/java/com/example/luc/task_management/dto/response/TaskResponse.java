package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.Task;
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
                .type(task.getType().name())
                .color(color)
                .priority(task.getPriority().name())
                .status(task.getStatus().name())
                .columnId(task.getColumn().getId())
                .columnName(task.getColumn().getName())
                .boardId(task.getBoard().getId())
                .assigneeId(task.getAssignee() != null
                        ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null
                        ? task.getAssignee().getFullName() : null)
                .assigneeAvatar(task.getAssignee() != null
                        ? task.getAssignee().getAvatarUrl() : null)
                .reporterId(task.getReporter().getId())
                .reporterName(task.getReporter().getFullName())
                .labels(task.getLabels().stream()
                        .map(LabelResponse::fromEntity)
                        .toList())
                .subtaskTotal(task.getSubtasks().size())
                .subtaskCompleted((int) task.getSubtasks().stream()
                        .filter(s -> s.getIsCompleted()).count())
                .completionPercentage(task.getCompletionPercentage())
                .deadline(task.getDeadline())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
