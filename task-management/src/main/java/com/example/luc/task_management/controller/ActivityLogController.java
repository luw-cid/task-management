package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.response.ActivityLogResponse;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.service.ActivityLogService;
import com.example.luc.task_management.util.IdFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getBoardActivityLogs(
            @PathVariable String boardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(activityLogService.getBoardActivityLogs(parsedBoardId, page, size)));
    }

    @GetMapping("/tasks/{taskId}/activity")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getTaskActivityLogs(
            @PathVariable String boardId,
            @PathVariable String taskId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        return ResponseEntity.ok(ApiResponse.success(activityLogService.getTaskActivityLogs(parsedBoardId, parsedTaskId)));
    }
}
