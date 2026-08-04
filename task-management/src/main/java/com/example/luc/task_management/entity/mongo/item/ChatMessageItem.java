package com.example.luc.task_management.entity.mongo.item;


import com.example.luc.task_management.enums.MessageType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageItem {

    private String id;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private MessageType type;
    private Boolean isDeleted;
    private LocalDateTime createdAt;


}
