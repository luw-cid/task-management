package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.response.StatisticsResponse;
import com.example.luc.task_management.dto.response.TaskResponse;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.pattern.factory.TaskFactory;
import com.example.luc.task_management.pattern.factory.TaskProduct;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.jpa.UserRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    // Lấy thống kê board
    @Transactional(readOnly = true)
    public StatisticsResponse getBoardStatistics(Long boarId) {
        User currentUser = SecurityUtils.getCurrentUser();

        // Check quyền access board
        if (!boardRepository.isUserInBoard(boarId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Task> tasks = taskRepository.findAllByBoardIdOrderByCreatedAtDesc(boarId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextWeek = now.plusDays(7);

        // -----Tổng quan-----
        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .count();
        int inProgressTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                .count();
        int overdueTasks = (int) tasks.stream()
                .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(now) && t.getStatus() != TaskStatus.DONE)
                .count();
        double completionRate = totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0;

        // -----Task theo status-----
        Map<String, Long> tasksByStatus = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getStatus().name(),
                        Collectors.counting()
                ));

        // -----Task theo Type-----
        Map<String, Long> tasksByType = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getType().name(),
                        Collectors.counting()
                ));

        Map<String, Long> tasksByPriority = tasks.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getPriority().name(),
                        Collectors.counting()
                ));

        // -----Thống kê theo thành viên-----
        List<StatisticsResponse.MemberStats> memberStats = calculatorMemberStats(tasks, now);

        // -----Task sắp tới (7 ngày)
        List<TaskResponse> upcomingDeadlines = tasks.stream()
                .filter(t -> t.getDeadline() != null
                        && t.getDeadline().isAfter(now)
                        && t.getDeadline().isBefore(nextWeek)
                        && t.getStatus() != TaskStatus.DONE)
                .sorted(Comparator.comparing(Task::getDeadline))
                .map(t -> {
                    TaskProduct product = TaskFactory.createTask(t.getType());
                    return TaskResponse.fromEntity(t, product.getColor());
                })
                .collect(Collectors.toList());

        // -----Task quá hạn -----
        List<TaskResponse> overdueTaskList = tasks.stream()
                .filter(t -> t.getDeadline() != null
                        && t.getDeadline().isBefore(now)
                        && t.getStatus() != TaskStatus.DONE)
                .sorted(Comparator.comparing(Task::getDeadline))
                .map(t -> {
                    TaskProduct product = TaskFactory.createTask(t.getType());
                    return TaskResponse.fromEntity(t, product.getColor());
                })
                .collect(Collectors.toList());

        return StatisticsResponse.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .overdueTasks(overdueTasks)
                .upcomingDeadline(upcomingDeadlines)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .tasksByStatus(tasksByStatus)
                .tasksByType(tasksByType)
                .taskByPriority(tasksByPriority)
                .memberStats(memberStats)
                .upcomingDeadline(upcomingDeadlines)
                .overdueTask2(overdueTaskList)
                .build();
    }

    // ─────────────────────────────────────────
    // HELPER – Tính thống kê từng thành viên
    // ─────────────────────────────────────────
    private List<StatisticsResponse.MemberStats> calculatorMemberStats(List<Task> task, LocalDateTime now) {
        // Group task theo assignee
        Map<Long, List<Task>> tasksByAssignee = task.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getAssignee().getId()
                ));

        return tasksByAssignee.entrySet().stream()
                .map(entry -> {
                    Long userId = entry.getKey();
                    List<Task> memberTasks = entry.getValue();
                    User user = memberTasks.get(0).getAssignee();

                    int assigned = memberTasks.size();
                    int completed = (int) memberTasks.stream()
                            .filter(t -> t.getStatus() == TaskStatus.DONE)
                            .count();
                    int inProgress = (int) memberTasks.stream()
                            .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                            .count();
                    int overdue = (int) memberTasks.stream()
                            .filter(t -> t.getDeadline() != null
                                    && t.getDeadline().isBefore(now)
                                    && t.getStatus() != TaskStatus.DONE)
                            .count();
                    double rate = assigned > 0 ? (double) completed / assigned * 100 : 0;

                    return StatisticsResponse.MemberStats.builder()
                            .userId(userId)
                            .fullName(user.getFullName())
                            .avatarUrl(user.getAvatarUrl())
                            .assigned(assigned)
                            .completed(completed)
                            .inProgress(inProgress)
                            .overdue(overdue)
                            .completionRate(Math.round(rate * 10.0) / 10.0)
                            .build();
                })
                .sorted(Comparator.comparingInt(StatisticsResponse.MemberStats::getAssigned)
                        .reversed())
                .collect(Collectors.toList());
    }
}
