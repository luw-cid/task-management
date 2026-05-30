package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.label.CreateLabelRequest;
import com.example.luc.task_management.dto.request.label.UpdateLabelRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.LabelResponse;
import com.example.luc.task_management.service.LabelService;
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

    private final LabelService  labelService;

    @PostMapping("/labels")
    @Operation(summary = "Crate new label on board")
    public ResponseEntity<ApiResponse<LabelResponse>> createLabel(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateLabelRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(labelService.createLabel(boardId, request)));
    }

    @GetMapping("/labels")
    @Operation(summary = "Get list labels on board")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> getLabels(
            @PathVariable Long boardId) {
        return ResponseEntity.ok(ApiResponse.success(labelService.getLabelsByBoard(boardId)));
    }

    @PutMapping("/labels/{labelId}")
    @Operation(summary = "Update label")
    public ResponseEntity<ApiResponse<LabelResponse>> updateLabel(
            @PathVariable Long boardId,
            @PathVariable Long labelId,
            @Valid @RequestBody UpdateLabelRequest request) {
        return ResponseEntity.ok(ApiResponse.success(labelService.updateLabel(boardId, labelId, request)));
    }

    @DeleteMapping("/labels/{labelId}")
    @Operation(summary = "Delete label on board")
    public ResponseEntity<ApiResponse<Void>> deleteLabel(
            @PathVariable Long boardId,
            @PathVariable Long labelId) {
        labelService.deleteLabel(boardId, labelId);
        return ResponseEntity.ok(ApiResponse.success("Label deleted successfully", null));
    }

    @PostMapping("/tasks/{taskId}/labels/{labelId}")
    @Operation(summary = "Add label to task")
    public ResponseEntity<ApiResponse<Void>> addLabelToTask(
            @PathVariable long boardId,
            @PathVariable long taskId,
            @PathVariable long labelId) {
        labelService.addLabelToTask(boardId, taskId, labelId);
        return ResponseEntity.ok(ApiResponse.success("Label added to task successfully", null));
    }

    @DeleteMapping({"/tasks/{taskId}/labels/{labelId}", "/task/{taskId}/labels/{labelId}"})
    @Operation(summary = "Remove label from task")
    public ResponseEntity<ApiResponse<Void>> removeLabelFromTask(
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long labelId) {
        labelService.removeLabelFromTask(boardId, taskId, labelId);
        return ResponseEntity.ok(ApiResponse.success("Label deleted successfully", null));
    }

}
