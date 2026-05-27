package com.example.luc.task_management.dto.request.board;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateBoardRequest {

    @Size(min = 2, max = 255, message = "Board's name must be from 2 to 255 characters long")
    private String name;

    private String description;
}
