package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.chat.SendMessageRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.ChatMessageResponse;
import com.example.luc.task_management.service.ChatService;
import com.example.luc.task_management.util.IdFormatter;
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
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody SendMessageRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.status(201).body(ApiResponse.created(chatService.sendMessage(parsedBoardId, parsedTaskId, request)));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(chatService.getMessages(parsedBoardId, parsedTaskId, page, size)));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> searchMessages(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(chatService.searchMessages(parsedBoardId, parsedTaskId, keyword, page, size)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> deleteMessage(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String messageId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        chatService.deleteMessage(parsedBoardId, parsedTaskId, messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> joinChat(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        chatService.notifyUserJoined(parsedBoardId, parsedTaskId);
        return ResponseEntity.ok(ApiResponse.success("Joined the chat room", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countMessage(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "count",
                chatService.countMessages(parsedBoardId, parsedTaskId)
        )));
    }
}
