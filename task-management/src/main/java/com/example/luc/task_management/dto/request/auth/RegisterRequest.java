package com.example.luc.task_management.dto.request.auth;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegisterRequest {
    @NotBlank(message = "Email can't be left blank")
    @Email(message = "Email isn't in the correct format")
    private String email;

    @NotBlank(message = "Password can't be left blank")
    @Size(min = 6, message = "Password must to be at least 6 characters long")
    private String password;

    @NotBlank(message = "Tên can't be left blank")
    @Size(min = 2, max = 100, message = "Name must be between 2 from 100 characters long")
    private String fullName;
}
