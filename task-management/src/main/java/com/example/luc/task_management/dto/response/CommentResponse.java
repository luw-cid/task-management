package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mongo.Comment;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private String id;
    private Long taskId;
    private String formattedTaskId; // ví dụ: "T00001"
    private Long userId;
    private String formattedUserId; // ví dụ: "U00001"
    private String userFullName;
    private String userAvatar;
    private String content;
    private Boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse fromDocument(Comment comment) {
        Long tId = comment.getTaskId();
        Long uId = comment.getUserId();

        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(tId)
                .formattedTaskId(IdFormatter.formatTaskId(tId))
                .userId(uId)
                .formattedUserId(IdFormatter.formatUserId(uId))
                .userFullName(comment.getUserFullName() != null ? comment.getUserFullName() : "User")
                .userAvatar(comment.getUserAvatar())
                .content(comment.getContent() != null ? comment.getContent() : "")
                .isEdited(Boolean.TRUE.equals(comment.getIsEdited()))
                .createdAt(comment.getCreatedAt() != null ? comment.getCreatedAt() : LocalDateTime.now())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    public static CommentResponse fromItem(com.example.luc.task_management.entity.mongo.item.CommentItem item, Long taskId) {
        Long uId = item.getUserId();

        return CommentResponse.builder()
                .id(item.getId())
                .taskId(taskId)
                .formattedTaskId(IdFormatter.formatTaskId(taskId))
                .userId(uId)
                .formattedUserId(IdFormatter.formatUserId(uId))
                .userFullName(item.getUserFullName() != null ? item.getUserFullName() : "User")
                .userAvatar(item.getUserAvatar())
                .content(item.getContent() != null ? item.getContent() : "")
                .isEdited(Boolean.TRUE.equals(item.getIsEdited()))
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt() : LocalDateTime.now())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
