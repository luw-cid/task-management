package com.example.luc.task_management.dto.request.profile;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Name must be between from 2 to 100 characters long.")
    private String fullName;

    @Size(max = 500, message = "The avatar URL must not exceed 500 characters.")
    private String avatarUrl;
}
