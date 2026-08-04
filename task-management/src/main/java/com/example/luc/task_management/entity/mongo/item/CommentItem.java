package com.example.luc.task_management.entity.mongo.item;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentItem {
    private String id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userAvatar;
    private String content;
    private Boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
