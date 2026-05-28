package com.example.luc.task_management.dto.request.subtask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateSubtaskRequest {

    @Size(min = 1, max = 255, message = "Title must be between from 1 to 255 characters long")
    private String title;

    private Boolean Completed;
}
