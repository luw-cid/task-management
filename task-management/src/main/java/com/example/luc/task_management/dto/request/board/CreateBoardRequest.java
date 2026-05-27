package com.example.luc.task_management.dto.request.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateBoardRequest {

    @NotBlank(message = "Board's name can't be left blank")
    @Size(min = 2, max = 256, message = "Board's name must be between from 2 to 256 characters long")
    private String name;

    private String description;
}
