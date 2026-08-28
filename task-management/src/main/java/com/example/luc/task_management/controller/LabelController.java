package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.label.CreateLabelRequest;
import com.example.luc.task_management.dto.request.label.UpdateLabelRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.LabelResponse;
import com.example.luc.task_management.service.LabelService;
import com.example.luc.task_management.util.IdFormatter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{boardId}")
@Tag(name = "Label", description = "Quản lý nhãn trong board")
public class LabelController {

    private final LabelService labelService;

    @PostMapping("/labels")
    @Operation(summary = "Create new label on board")
    public ResponseEntity<ApiResponse<LabelResponse>> createLabel(
            @PathVariable String boardId,
            @Valid @RequestBody CreateLabelRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.status(201).body(ApiResponse.created(labelService.createLabel(parsedBoardId, request)));
    }

    @GetMapping("/labels")
    @Operation(summary = "Get list labels on board")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> getLabels(
            @PathVariable String boardId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(labelService.getLabelsByBoard(parsedBoardId)));
    }

    @PutMapping("/labels/{labelId}")
    @Operation(summary = "Update label")
    public ResponseEntity<ApiResponse<LabelResponse>> updateLabel(
            @PathVariable String boardId,
            @PathVariable String labelId,
            @Valid @RequestBody UpdateLabelRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedLabelId = IdFormatter.parseId(labelId);
        return ResponseEntity.ok(ApiResponse.success(labelService.updateLabel(parsedBoardId, parsedLabelId, request)));
    }

    @DeleteMapping("/labels/{labelId}")
    @Operation(summary = "Delete label on board")
    public ResponseEntity<ApiResponse<Void>> deleteLabel(
            @PathVariable String boardId,
            @PathVariable String labelId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedLabelId = IdFormatter.parseId(labelId);
        labelService.deleteLabel(parsedBoardId, parsedLabelId);
        return ResponseEntity.ok(ApiResponse.success("Label deleted successfully", null));
    }

    @PostMapping("/tasks/{taskId}/labels/{labelId}")
    @Operation(summary = "Add label to task")
    public ResponseEntity<ApiResponse<Void>> addLabelToTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String labelId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        Long parsedLabelId = IdFormatter.parseId(labelId);
        labelService.addLabelToTask(parsedBoardId, parsedTaskId, parsedLabelId);
        return ResponseEntity.ok(ApiResponse.success("Label added to task successfully", null));
    }

    @DeleteMapping({"/tasks/{taskId}/labels/{labelId}", "/task/{taskId}/labels/{labelId}"})
    @Operation(summary = "Remove label from task")
    public ResponseEntity<ApiResponse<Void>> removeLabelFromTask(
            @PathVariable String boardId,
            @PathVariable String taskId,
            @PathVariable String labelId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedTaskId = IdFormatter.parseId(taskId);
        Long parsedLabelId = IdFormatter.parseId(labelId);
        labelService.removeLabelFromTask(parsedBoardId, parsedTaskId, parsedLabelId);
        return ResponseEntity.ok(ApiResponse.success("Label deleted successfully", null));
    }
}
