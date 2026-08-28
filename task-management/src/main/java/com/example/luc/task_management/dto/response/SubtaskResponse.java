package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Subtask;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubtaskResponse {

    private Long id;
    private String formattedId;     // ví dụ: "ST00001"
    private Long taskId;
    private String formattedTaskId; // ví dụ: "T00001"
    private String title;
    private boolean completed;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SubtaskResponse fromEtity(Subtask subtask) {
        Long tId = subtask.getTask() != null ? subtask.getTask().getId() : null;

        return SubtaskResponse.builder()
                .id(subtask.getId())
                .formattedId(IdFormatter.formatSubtaskId(subtask.getId()))
                .taskId(tId)
                .formattedTaskId(IdFormatter.formatTaskId(tId))
                .title(subtask.getTitle())
                .completed(Boolean.TRUE.equals(subtask.getIsCompleted()))
                .position(subtask.getPosition())
                .createdAt(subtask.getCreatedAt())
                .updatedAt(subtask.getUpdatedAt())
                .build();
    }
}
