package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.StatisticsResponse;
import com.example.luc.task_management.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/boards/{boardId}/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<StatisticsResponse>> getBoardStatistics(
            @PathVariable Long boardId) {
        return ResponseEntity.ok(ApiResponse.success(statisticsService.getBoardStatistics(boardId)));
    }
}
