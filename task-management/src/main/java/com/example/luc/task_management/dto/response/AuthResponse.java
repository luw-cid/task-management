package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.util.IdFormatter;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private UserInfo user;

    // Class con lưu thông tin user trả về
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String formattedId; // ví dụ: "U00001"
        private String email;
        private String fullname;
        private String avatarUrl;
        private String role;

        // Map từ Entity → DTO ngay tại đây
        public static UserInfo fromEntity(User user) {
            return UserInfo.builder()
                    .id(user.getId())
                    .formattedId(IdFormatter.formatUserId(user.getId()))
                    .email(user.getEmail())
                    .fullname(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .role(user.getRole() != null ? user.getRole().name() : null)
                    .build();
        }
    }
}
