package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.BoardMember;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMemberResponse {

    private Long id;
    private Long userId;
    private String formattedUserId; // ví dụ: "U00001"
    private String fullname;
    private String email;
    private String avatarUrl;
    private String role;

    public static BoardMemberResponse fromEntity(BoardMember member) {
        Long uId = member.getUser() != null ? member.getUser().getId() : null;
        String name = member.getUser() != null ? member.getUser().getFullName() : null;
        String mail = member.getUser() != null ? member.getUser().getEmail() : null;
        String avatar = member.getUser() != null ? member.getUser().getAvatarUrl() : null;

        return BoardMemberResponse.builder()
                .id(member.getId())
                .userId(uId)
                .formattedUserId(IdFormatter.formatUserId(uId))
                .fullname(name)
                .email(mail)
                .avatarUrl(avatar)
                .role(member.getRole() != null ? member.getRole().name() : null)
                .build();
    }
}
