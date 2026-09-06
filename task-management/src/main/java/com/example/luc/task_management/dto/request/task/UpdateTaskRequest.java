package com.example.luc.task_management.dto.request.task;

import com.example.luc.task_management.enums.TaskPriority;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class UpdateTaskRequest {

    private String title;
    private String description;
    private TaskPriority priority;
    private LocalDateTime deadline;
    private Long version;
}
