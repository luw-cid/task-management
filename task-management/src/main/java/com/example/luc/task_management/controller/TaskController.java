package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.task.AssignTaskRequest;
import com.example.luc.task_management.dto.request.task.CreateTaskRequest;
import com.example.luc.task_management.dto.request.task.MoveTaskRequest;
import com.example.luc.task_management.dto.request.task.UpdateTaskRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.TaskResponse;
import com.example.luc.task_management.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateTaskRequest request ) {
        return ResponseEntity.status(201).body(ApiResponse.created(taskService.createTask(boardId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTaskByBoard(
            @PathVariable Long boardId,
            @RequestParam (defaultValue = "createdAt") String sortBy) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByBoard(boardId, sortBy)));
    }

    @GetMapping ("/column/{columnId}")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByColumn (
            @PathVariable Long boarId,
            @PathVariable Long columnId ) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByColumn(boarId, columnId)));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById (
            @PathVariable Long boardId,
            @PathVariable Long taskId ) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(boardId, taskId)));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask (
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request ) {
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", taskService.updateTask(boardId, taskId, request)));
    }

    @PutMapping("/{taskId}/move")
    public ResponseEntity<ApiResponse<TaskResponse>> moveTask (
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody MoveTaskRequest request ) {
        return ResponseEntity.ok(ApiResponse.success("Task moved successfully", taskService.moveTask(boardId, taskId, request)));
    }

    @PutMapping("/{taskId}/assign")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask (
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody AssignTaskRequest request ) {
        return ResponseEntity.ok(ApiResponse.success("Task assigned successfully", taskService.assignTask(boardId, taskId, request)));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteTask (
            @PathVariable Long boardId,
            @PathVariable Long taskId ) {
        taskService.deleteTask(boardId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }
}
