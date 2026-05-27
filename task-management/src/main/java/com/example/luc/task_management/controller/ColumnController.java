package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.column.CreateColumnRequest;
import com.example.luc.task_management.dto.request.column.UpdateColumnRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.ColumnResponse;
import com.example.luc.task_management.service.ColumnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}/columns")
@RequiredArgsConstructor
public class ColumnController {
    private final ColumnService columnService;

    @PostMapping
    public ResponseEntity<ApiResponse<ColumnResponse>> createColumn(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateColumnRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(columnService.createColumn(boardId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ColumnResponse>>> getColumnsByBoard(@PathVariable Long boardId) {
        return ResponseEntity.ok(ApiResponse.success(columnService.getColumnsByBoard(boardId)));
    }

    @PutMapping("/{columnId}")
    public ResponseEntity<ApiResponse<ColumnResponse>> updateColumn (
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @Valid @RequestBody UpdateColumnRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Update successfully" ,columnService.updateColumn(boardId, columnId, request)));
    }

    @DeleteMapping("/{columnId}")
    public ResponseEntity<ApiResponse<Void>> deleteColumn(@PathVariable Long boardId, @PathVariable Long columnId) {
        columnService.deleteColumn(boardId, columnId);
        return ResponseEntity.ok(ApiResponse.success("Delete successfully", null));
    }
}
