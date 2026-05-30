package com.example.luc.task_management.dto.request.label;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateLabelRequest {

    @NotBlank(message = "Label can not be left")
    @Size(min = 1, max = 50, message = "Title must be between from 1 to 50 characters long")
    private String name;

    @NotBlank(message = "Color can not be left")
    @Pattern(
            regexp = "^#([A-Fa-f0-9]{6})$",
            message = "Color must be in the correct hex format (VD: #6366f1)"
    )
    private String color;
}
