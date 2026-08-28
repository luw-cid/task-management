package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.task.AssignTaskRequest;
import com.example.luc.task_management.dto.request.task.CreateTaskRequest;
import com.example.luc.task_management.dto.request.task.MoveTaskRequest;
import com.example.luc.task_management.dto.request.task.UpdateTaskRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.TaskResponse;
import com.example.luc.task_management.service.TaskService;
import com.example.luc.task_management.util.IdFormatter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}/tasks")
@RequiredArgsConstructor
@Tag(name = "Task", description = "Manage Task – Factory, Strategy, Command, Observer Pattern")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @Operation(
            summary = "Create new task",
            description = "Use the Factory Pattern to automatically set priority order by type"
    )
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable String boardId,
            @Valid @RequestBody CreateTaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.status(201).body(ApiResponse.created(taskService.createTask(parsedBoardId, request)));
    }

    @GetMapping
    @Operation(
            summary = "Get list task",
            description = "Use the Strategy Pattern to sort. sortBy: deadline|priority|assignee|createdAt"
    )
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTaskByBoard(
            @PathVariable String boardId,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByBoard(parsedBoardId, sortBy)));
    }

    @GetMapping("/column/{columnId}")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByColumn(
            @PathVariable String boardId,
            @PathVariable String columnId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedColumnId = IdFormatter.parseId(columnId);
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByColumn(parsedBoardId, parsedColumnId)));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(parsedBoardId, parsedTaskId)));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", taskService.updateTask(parsedBoardId, parsedTaskId, request)));
    }

    @PutMapping("/{taskId}/move")
    @Operation(
            summary = "Move task to difference column",
            description = "Use the Command Pattern to record history + Observer Pattern to send notifications"
    )
    public ResponseEntity<ApiResponse<TaskResponse>> moveTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody MoveTaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task moved successfully", taskService.moveTask(parsedBoardId, parsedTaskId, request)));
    }

    @PutMapping("/{taskId}/assign")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @Valid @RequestBody AssignTaskRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task assigned successfully", taskService.assignTask(parsedBoardId, parsedTaskId, request)));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteTask(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        taskService.deleteTask(parsedBoardId, parsedTaskId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }
}
