package com.example.luc.task_management.controller;


import com.example.luc.task_management.dto.request.chat.SendMessageRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.ChatMessageResponse;
import com.example.luc.task_management.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards/{boardId}/tasks/{taskId}/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(chatService.sendMessage(boardId, taskId, request)));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getMessages(boardId, taskId, page, size)));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> searchMessages(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(chatService.searchMessages(boardId, taskId, keyword, page, size)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> deleteMessage(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable String messageId) {
        chatService.deleteMessage(boardId, taskId, messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> joinChat(
            @PathVariable Long boardId,
            @PathVariable Long taskId) {
        chatService.notifyUserJoined(boardId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Joined the chat room", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>>countMessage(
            @PathVariable Long boardId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "count",
                chatService.countMessages(boardId, taskId)
        )));
    }

}
