package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.column.CreateColumnRequest;
import com.example.luc.task_management.dto.request.column.UpdateColumnRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.ColumnResponse;
import com.example.luc.task_management.service.ColumnService;
import com.example.luc.task_management.util.IdFormatter;
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
            @PathVariable String boardId,
            @Valid @RequestBody CreateColumnRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.status(201).body(ApiResponse.created(columnService.createColumn(parsedBoardId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ColumnResponse>>> getColumnsByBoard(@PathVariable String boardId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        return ResponseEntity.ok(ApiResponse.success(columnService.getColumnsByBoard(parsedBoardId)));
    }

    @PutMapping("/{columnId}")
    public ResponseEntity<ApiResponse<ColumnResponse>> updateColumn(
            @PathVariable String boardId,
            @PathVariable String columnId,
            @Valid @RequestBody UpdateColumnRequest request) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedColumnId = IdFormatter.parseId(columnId);
        return ResponseEntity.ok(ApiResponse.success("Update successfully", columnService.updateColumn(parsedBoardId, parsedColumnId, request)));
    }

    @DeleteMapping("/{columnId}")
    public ResponseEntity<ApiResponse<Void>> deleteColumn(
            @PathVariable String boardId,
            @PathVariable String columnId) {
        Long parsedBoardId = IdFormatter.parseId(boardId);
        Long parsedColumnId = IdFormatter.parseId(columnId);
        columnService.deleteColumn(parsedBoardId, parsedColumnId);
        return ResponseEntity.ok(ApiResponse.success("Delete successfully", null));
    }
}
