package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.User;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private UserInfo user;

    // Class con lưu thông tin user trả về
    // Gộp luôn vào đây thay vì tạo file UserProfileResponse riêng
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String fullname;
        private String avatarUrl;
        private String role;

        // Map từ Entity → DTO ngay tại đây
        public static UserInfo fromEntity (User user) {
            return UserInfo.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullname(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .role(user.getRole().name())
                    .build();
        }
    }
}
