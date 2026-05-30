package com.example.luc.task_management.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsResponse {

    // Tổng quan
    private int totalTasks;
    private int completedTasks;
    private int inProgressTasks;
    private int overdueTasks;
    private double completionRate;  // % hoành thành

    // Task theo trạng thái
    private Map<String, Long> tasksByStatus;
    // VD: {"TODO": 6, "IN_PROGRESS": 8, "IN_REVIEW": 4, "DONE": 12}

    // Task theo loại
    private Map<String, Long> tasksByType;
    // VD: {"BUG": 6, "FEATURE": 8, "IMPROVEMENT": 6, "EPIC": 4}

    private Map<String, Long> taskByPriority;

    // Hiệu suất từng thành viên
    private List<MemberStats> memberStats;

    // Task sắp đến hạn (trong 7 ngày tới)
    private List<TaskResponse> upcomingDeadline;

    // Task quá hạn
    private List<TaskResponse> overdueTask2;

    // Inner class thống kê theo thành viên
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberStats {
        private Long userId;
        private String fullName;
        private String avatarUrl;
        private int assigned;
        private int completed;
        private int inProgress;
        private int overdue;
        private double completionRate;
    }
}
