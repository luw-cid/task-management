package com.example.luc.task_management.dto.response;


import com.example.luc.task_management.entity.mysql.Subtask;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubtaskResponse {

    private Long id;
    private Long taskId;
    private String title;
    private boolean completed;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SubtaskResponse fromEtity(Subtask subtask) {
        return SubtaskResponse.builder()
                .id(subtask.getId())
                .taskId(subtask.getTask().getId())
                .title(subtask.getTitle())
                .completed(subtask.getIsCompleted())
                .position(subtask.getPosition())
                .createdAt(subtask.getCreatedAt())
                .updatedAt(subtask.getUpdatedAt())
                .build();
    }
}
