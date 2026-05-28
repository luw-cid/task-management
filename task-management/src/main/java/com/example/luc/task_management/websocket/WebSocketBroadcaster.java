package com.example.luc.task_management.websocket;

import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component  // ← Singleton Pattern
@RequiredArgsConstructor
public class WebSocketBroadcaster {

    // SimpleMessageTemplate là công cụ gửi message của spring WebSocket
    private final SimpMessagingTemplate messagingTemplate;

    //  Gửi tới tất cả thành viên trong 1 board
    // Client subscribe: /topic/board/{boardId}
    public <T> void broadcastToBoard(Long boardId, WebSocketMessage<T> message) {
        String destination = "/topic/board/" + boardId;
        messagingTemplate.convertAndSend(destination, message);
        log.info("Broadcast to board {}: {}", boardId, message.getType());
    }

    // Gửi tới 1 USER cụ thể (thông báo cá nhân)
    // Client subscribe: /user/queue/notifications
    public <T> void sendToUser(String userEmail, WebSocketMessage<T> message) {
        String destination = "/queue/notifications/";
        messagingTemplate.convertAndSendToUser(userEmail, destination, message);
        log.info("Send to user {}: {}", userEmail, message.getType());
    }

    // Gửi tới 1 TASK cụ thể (comment real-time)
    // Client subscribe: /topic/task/{taskId}/comments
    public <T> void broadcastToTask(Long taskId, WebSocketMessage<T> message) {
        String destination = "/topic/task/" + taskId + "/comments";
        messagingTemplate.convertAndSend(destination, message);
        log.info("Broadcast to task {}: {}", taskId, message.getType());
    }

}
