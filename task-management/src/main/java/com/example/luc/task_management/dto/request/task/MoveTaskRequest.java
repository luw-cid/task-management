package com.example.luc.task_management.dto.request.task;

import com.example.luc.task_management.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MoveTaskRequest {

    @NotNull(message = "Column can't be left blank")
    private Long columnId;

    @NotNull(message = "Status can't be left blank")
    private TaskStatus status;
}
