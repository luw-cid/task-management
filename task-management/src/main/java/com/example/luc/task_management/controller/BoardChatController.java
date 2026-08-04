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
@RequestMapping("/api/boards/{boardId}/chat")
@RequiredArgsConstructor
public class BoardChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendBoardMessage(
            @PathVariable Long boardId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(chatService.sendBoardMessage(boardId, request)));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getBoardMessages(
            @PathVariable Long boardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getBoardMessages(boardId, page, size)));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> searchBoardMessages(
            @PathVariable Long boardId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(chatService.searchBoardMessages(boardId, keyword, page, size)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteBoardMessage(
            @PathVariable Long boardId,
            @PathVariable String messageId) {
        chatService.deleteBoardMessage(boardId, messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> joinBoardChat(
            @PathVariable Long boardId) {
        chatService.notifyUserJoinedBoard(boardId);
        return ResponseEntity.ok(ApiResponse.success("Joined the board chat room", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countBoardMessage(
            @PathVariable Long boardId) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "count",
                chatService.countBoardMessages(boardId)
        )));
    }
}
