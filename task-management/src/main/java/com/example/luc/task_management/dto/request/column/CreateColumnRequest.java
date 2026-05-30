package com.example.luc.task_management.dto.request.column;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateColumnRequest {
    @NotBlank(message = "Column's name can't be left blank")
    @Size(min = 1, max = 50, message = "Column's name must be between 1 from 50 characters long")
    private String name;
}
