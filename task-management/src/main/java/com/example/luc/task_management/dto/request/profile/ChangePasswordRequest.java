package com.example.luc.task_management.dto.request.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChangePasswordRequest {

    @NotBlank(message = "Current password cannot be left blank")
    private String currentPassword;

    @NotBlank(message = "New password cannot be left blank")
    @Size(min = 6, max = 50, message = "New password must be between from 6 to 50 characters long")
    private String newPassword;

    @NotBlank(message = "Confirm password cannot be left blank")
    private String confirmPassword;
}
