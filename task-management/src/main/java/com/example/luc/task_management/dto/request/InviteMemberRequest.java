package com.example.luc.task_management.dto.request;


import com.example.luc.task_management.enums.BoardRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class InviteMemberRequest {

    @NotBlank(message = "Email can't be left blank")
    @Email(message = "Email isn't in the incorrect format")
    private String email;

    @NotNull(message = "Role can't be left blank")
    private BoardRole role;
}
