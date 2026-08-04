package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mongo.ChatMessage;
import com.example.luc.task_management.enums.MessageType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private String id;
    private Long taskId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;
    private Boolean isDeleted;
    private boolean isOwn;
    private LocalDateTime createdAt;

    public static ChatMessageResponse fromDocument (ChatMessage message, Long currentUserId) {
        boolean isDeleted = Boolean.TRUE.equals(message.getIsDeleted());
        return ChatMessageResponse.builder()
                .id(message.getId())
                .taskId(message.getTaskId())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .senderAvatar(message.getSenderAvatar())
                .content(isDeleted ? "Message is deleted" : message.getContent())
                .type(message.getType() != null ? message.getType().name() : MessageType.TEXT.name())
                .isDeleted(isDeleted)
                .isOwn(java.util.Objects.equals(message.getSenderId(), currentUserId))
                .createdAt(message.getCreatedAt())
                .build();
    }
}
