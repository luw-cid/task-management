package com.example.luc.task_management.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefit cho message gửi từ server -> client
        // Client subscribe: /topic/board/1 and user/queue/notifications
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefit cho message gửi từ client -> server
        registry.setApplicationDestinationPrefixes("/app");
        // Prefit cho message gửi cho 1 user duy nhất
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback cho browser không hỗ trợ WebSocket
    }
}
