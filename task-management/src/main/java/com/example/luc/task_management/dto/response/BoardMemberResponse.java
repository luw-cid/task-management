package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.BoardMember;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMemberResponse {

    private Long id;
    private Long userId;
    private String fullname;
    private String email;
    private String avatarUrl;
    private String role;

    public static BoardMemberResponse fromEntity(BoardMember member) {
        return BoardMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .fullname(member.getUser().getFullName())
                .email(member.getUser().getEmail())
                .avatarUrl(member.getUser().getAvatarUrl())
                .role(member.getRole().name())
                .build();
    }
}
