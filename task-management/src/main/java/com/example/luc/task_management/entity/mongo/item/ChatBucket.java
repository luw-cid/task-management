package com.example.luc.task_management.entity.mongo.item;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "chat_buckets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatBucket {

    @Id
    private String id;
    private Long boardId;
    private Long taskId;
    private int bucketIndex;
    private int count;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @Builder.Default
    private List<ChatMessageItem> messages = new ArrayList<>();
}
