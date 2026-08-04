package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mongo.Comment;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private String id;
    private Long taskId;
    private Long userId;
    private String userFullName;
    private String userAvatar;
    private String content;
    private Boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse fromDocument(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTaskId())
                .userId(comment.getUserId())
                .userFullName(comment.getUserFullName() != null ? comment.getUserFullName() : "User")
                .userAvatar(comment.getUserAvatar())
                .content(comment.getContent() != null ? comment.getContent() : "")
                .isEdited(Boolean.TRUE.equals(comment.getIsEdited()))
                .createdAt(comment.getCreatedAt() != null ? comment.getCreatedAt() : LocalDateTime.now())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    public static CommentResponse fromItem(com.example.luc.task_management.entity.mongo.item.CommentItem item, Long taskId) {
        return CommentResponse.builder()
                .id(item.getId())
                .taskId(taskId)
                .userId(item.getUserId())
                .userFullName(item.getUserFullName() != null ? item.getUserFullName() : "User")
                .userAvatar(item.getUserAvatar())
                .content(item.getContent() != null ? item.getContent() : "")
                .isEdited(Boolean.TRUE.equals(item.getIsEdited()))
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt() : LocalDateTime.now())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
