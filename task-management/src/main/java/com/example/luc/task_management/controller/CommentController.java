package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.CreateCommentRequest;
import com.example.luc.task_management.dto.request.UpdateCommentRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.CommentResponse;
import com.example.luc.task_management.service.CommentServer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{boardId}/tasks/{taskId}/comments")
public class CommentController {

    private final CommentServer commentServer;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request ) {
        return ResponseEntity.status(201).body(ApiResponse.created(commentServer.addComment(boardId, taskId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable Long boarId,
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size ) {
        return ResponseEntity.ok(ApiResponse.success(commentServer.getComments(boarId, taskId, page, size)));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request ) {
        return ResponseEntity.ok(ApiResponse.success("Comment update successfully", commentServer.updateComment(boardId, taskId, commentId, request)));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long commentId ) {
        commentServer.deleteComment(boardId, taskId, commentId);
        return ResponseEntity.ok((ApiResponse.success("Comment deleted successfully", null)));
    }
}
