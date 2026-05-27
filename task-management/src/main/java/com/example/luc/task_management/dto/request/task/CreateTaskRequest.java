package com.example.luc.task_management.dto.request.task;

import com.example.luc.task_management.enums.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class CreateTaskRequest {

    @NotBlank(message = "Title can't be left blank")
    @Size(min = 2, max = 255, message = "Title must be between from 2 to 255 characters long")
    private String title;

    private String description;

    @NotNull(message = "Type of task can't be left blank")
    private TaskType type;

    @NotNull(message = "Column can't be left blank")
    private Long columnId;

    private Long assigneeId;

    private LocalDateTime deadline;
}
