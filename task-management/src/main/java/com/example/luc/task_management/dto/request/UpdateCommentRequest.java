package com.example.luc.task_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateCommentRequest {

    @NotBlank(message = "Content can not be left blank")
    @Size(min = 1, max = 1000, message = "Content must be between from 1 to 1000.")
    private String content;
}
