package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mongo.ChatMessage;
import com.example.luc.task_management.entity.mongo.item.ChatMessageItem;
import com.example.luc.task_management.enums.MessageType;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private String id;
    private Long taskId;
    private String formattedTaskId;   // ví dụ: "T00001"
    private Long senderId;
    private String formattedSenderId; // ví dụ: "U00001"
    private String senderName;
    private String senderAvatar;
    private String content;
    private String type;
    private Boolean isDeleted;
    private boolean isOwn;
    private LocalDateTime createdAt;

    public static ChatMessageResponse fromDocument(ChatMessage message, Long currentUserId) {
        boolean isDeleted = Boolean.TRUE.equals(message.getIsDeleted());
        Long tId = message.getTaskId();
        Long sId = message.getSenderId();

        return ChatMessageResponse.builder()
                .id(message.getId())
                .taskId(tId)
                .formattedTaskId(IdFormatter.formatTaskId(tId))
                .senderId(sId)
                .formattedSenderId(IdFormatter.formatUserId(sId))
                .senderName(message.getSenderName())
                .senderAvatar(message.getSenderAvatar())
                .content(isDeleted ? "Message is deleted" : message.getContent())
                .type(message.getType() != null ? message.getType().name() : MessageType.TEXT.name())
                .isDeleted(isDeleted)
                .isOwn(java.util.Objects.equals(sId, currentUserId))
                .createdAt(message.getCreatedAt())
                .build();
    }

    public static ChatMessageResponse fromItem(ChatMessageItem item, Long currentUserId) {
        boolean isDeleted = Boolean.TRUE.equals(item.getIsDeleted());
        Long sId = item.getSenderId();

        return ChatMessageResponse.builder()
                .id(item.getId())
                .senderId(sId)
                .formattedSenderId(IdFormatter.formatUserId(sId))
                .senderName(item.getSenderName())
                .senderAvatar(item.getSenderAvatar())
                .content(isDeleted ? "Message is deleted" : item.getContent())
                .type(item.getType() != null ? item.getType().name() : MessageType.TEXT.name())
                .isDeleted(isDeleted)
                .isOwn(java.util.Objects.equals(sId, currentUserId))
                .createdAt(item.getCreatedAt())
                .build();
    }
}
