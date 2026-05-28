package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.subtask.CreateSubtaskRequest;
import com.example.luc.task_management.dto.request.subtask.UpdateSubtaskRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.SubtaskResponse;
import com.example.luc.task_management.service.SubtaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{boardId}/tasks/{taskId}/subtasks")
public class SubtaskController {

    private final SubtaskService subtaskServer;

    @PostMapping
    public ResponseEntity<ApiResponse<SubtaskResponse>> createSubtask(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateSubtaskRequest request ) {
        return ResponseEntity.status(201).body(ApiResponse.created(subtaskServer.createSubtask(boardId, taskId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubtaskResponse>>> getSubtasks(
            @PathVariable Long boardId,
            @PathVariable Long taskId ) {
        return ResponseEntity.ok(ApiResponse.success(subtaskServer.getSubtasks(boardId, taskId)));
    }

    @PutMapping("/{subtaskId}")
    public ResponseEntity<ApiResponse<SubtaskResponse>> updateSubtask(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @Valid @RequestBody UpdateSubtaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Subtask updated successfully", subtaskServer.updateSubtask(boardId, taskId, subtaskId, request)));
    }

    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<ApiResponse<Void>> deleteSubTask(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long subtaskId ) {
        subtaskServer.deleteSubtask(boardId, taskId, subtaskId);
        return ResponseEntity.ok(ApiResponse.success("Subtask deleted successfully", null));
    }
}
