package com.example.luc.task_management.dto.request.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateCommentRequest {

    @NotBlank(message = "Content can't be left blank")
    @Size(min = 1, max = 1000, message = "Content must be between from 1 to 1000 characters long.")
    private String content;


}
