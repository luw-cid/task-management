package com.example.luc.task_management.dto.websocket;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage<T> {

    private WebSocketMessageType type;  // Loại sự kiện
    private T payload;                  // Data kèm theo
    private Long boardId;               // Board liên quan (nếu có)
    private Long taskId;                // Task liên quan (nếu có)
    private String triggeredBy;         // Email người thực hiện
    private LocalDateTime timestamp;

    public static <T> WebSocketMessage<T> of(WebSocketMessageType type, T payload, Long boardId, String triggeredBy) {
        return WebSocketMessage.<T>builder()
                .type(type)
                .payload(payload)
                .boardId(boardId)
                .triggeredBy(triggeredBy)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
