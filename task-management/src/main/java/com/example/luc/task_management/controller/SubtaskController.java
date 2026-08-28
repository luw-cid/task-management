package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.subtask.CreateSubtaskRequest;
import com.example.luc.task_management.dto.request.subtask.UpdateSubtaskRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.SubtaskResponse;
import com.example.luc.task_management.service.SubtaskService;
import com.example.luc.task_management.util.IdFormatter;
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
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody CreateSubtaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.status(201).body(ApiResponse.created(subtaskServer.createSubtask(parsedBoardId, parsedTaskId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubtaskResponse>>> getSubtasks(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(subtaskServer.getSubtasks(parsedBoardId, parsedTaskId)));
    }

    @PutMapping("/{subtaskId}")
    public ResponseEntity<ApiResponse<SubtaskResponse>> updateSubtask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String subtaskId,
            @Valid @RequestBody UpdateSubtaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        Long parsedSubtaskId = IdFormatter.parseId(subtaskId);
        return ResponseEntity.ok(ApiResponse.success("Subtask updated successfully", subtaskServer.updateSubtask(parsedBoardId, parsedTaskId, parsedSubtaskId, request)));
    }

    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<ApiResponse<Void>> deleteSubTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String subtaskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        Long parsedSubtaskId = IdFormatter.parseId(subtaskId);
        subtaskServer.deleteSubtask(parsedBoardId, parsedTaskId, parsedSubtaskId);
        return ResponseEntity.ok(ApiResponse.success("Subtask deleted successfully", null));
    }
}
