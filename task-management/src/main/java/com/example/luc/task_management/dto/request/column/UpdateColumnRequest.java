package com.example.luc.task_management.dto.request.column;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateColumnRequest {

    @Size(min = 1, max = 100, message = "Column's name must be beween 1 from 100 characters long")
    private String name;

    private Integer position; // dùng khoi thay đô thứ tự cột
}
