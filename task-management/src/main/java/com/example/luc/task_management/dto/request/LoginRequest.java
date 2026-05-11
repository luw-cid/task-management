package com.example.luc.task_management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {

    @NotBlank(message = "Email can't be left blank")
    @Email(message = "Email isn't in the incorrect format")
    private String email;

    @NotBlank(message = "Password can't be left blank")
    private String password;
}
