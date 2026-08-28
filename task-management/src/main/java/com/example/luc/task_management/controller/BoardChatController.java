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
@RequestMapping("/api/boards/{boardId}/chat")
@RequiredArgsConstructor
public class BoardChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendBoardMessage(
            @PathVariable String boardId,
            @Valid @RequestBody SendMessageRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.status(201).body(ApiResponse.created(chatService.sendBoardMessage(parsedBoardId, request)));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getBoardMessages(
            @PathVariable String boardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(chatService.getBoardMessages(parsedBoardId, page, size)));
    }

    @GetMapping("/messages/search")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> searchBoardMessages(
            @PathVariable String boardId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(chatService.searchBoardMessages(parsedBoardId, keyword, page, size)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteBoardMessage(
            @PathVariable String boardId,
            @PathVariable String messageId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        chatService.deleteBoardMessage(parsedBoardId, messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> joinBoardChat(
            @PathVariable String boardId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        chatService.notifyUserJoinedBoard(parsedBoardId);
        return ResponseEntity.ok(ApiResponse.success("Joined the board chat room", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countBoardMessage(
            @PathVariable String boardId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "count",
                chatService.countBoardMessages(parsedBoardId)
        )));
    }
}
