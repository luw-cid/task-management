package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.comment.CreateCommentRequest;
import com.example.luc.task_management.dto.request.comment.UpdateCommentRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.CommentResponse;
import com.example.luc.task_management.service.CommentService;
import com.example.luc.task_management.util.IdFormatter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{boardId}/tasks/{taskId}/comments")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody CreateCommentRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.status(201).body(ApiResponse.created(commentService.addComment(parsedBoardId, parsedTaskId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(commentService.getComments(parsedBoardId, parsedTaskId, page, size)));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", commentService.updateComment(parsedBoardId, parsedTaskId, commentId, request)));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String commentId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        commentService.deleteComment(parsedBoardId, parsedTaskId, commentId);
        return ResponseEntity.ok((ApiResponse.success("Comment deleted successfully", null)));
    }
}
