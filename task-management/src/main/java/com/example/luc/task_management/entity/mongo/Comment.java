package com.example.luc.task_management.entity.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "comments")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    private String id;

    private Long taskId;
    private Long boardId;

    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userAvatar;

    private String content;
    private Boolean isEdited;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
