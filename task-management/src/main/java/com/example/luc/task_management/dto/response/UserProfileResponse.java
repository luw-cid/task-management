package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String formattedId; // ví dụ: "U00001"
    private String email;
    private String fullName;
    private String avatarUrl;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static UserProfileResponse fromEntity(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .formattedId(IdFormatter.formatUserId(user.getId()))
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
