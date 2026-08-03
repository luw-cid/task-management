package com.example.luc.task_management.entity.mongo;

import com.example.luc.task_management.enums.MessageType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
@Document(collection = "chat_messages")  // ← Tên collection trong MongoDB
@CompoundIndexes({
        // Index để query nhanh theo taskId + thời gian
        @CompoundIndex(name = "idx_task_created",
                def = "{'taskId': 1, 'createdAt': -1}"),
        // Index để query theo boardId
        @CompoundIndex(name = "idx_board_created",
                def = "{'boardId': 1, 'createdAt': -1}")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    private String id;

    @Field("task_id")
    private Long taskId;

    @Field("board_id")
    private Long boardId;

    @Field("sender_id")
    private Long senderId;  // userId

    @Field("sender_name")
    private String senderName;  // // Denormalize để tránh JOIN

    @Field("sender_avatar")
    private String senderAvatar;

    @Field("content")
    private String content;

    @Field("type")
    private MessageType type;

    @Field("is_deleted")
    private Boolean isDeleted = false;

    @Field("created_at")
    private LocalDateTime createdAt;



}
