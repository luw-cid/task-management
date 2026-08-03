package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.response.ActivityLogResponse;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.ActivityLogRepository;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final BoardRepository boardRepository;
    private final TaskRepository taskRepository;

    // Lấy lịch sử theo board (pagination)
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getBoardActivityLogs(Long boardId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();

        // ckeck user in board ?
        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size);
        return activityLogRepository.findAllByBoardIdOrderByCreatedAtDesc(boardId, pageable)
                .stream()
                .map(ActivityLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Get history activity log by task
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getTaskActivityLogs(Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        return activityLogRepository.findAllByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(ActivityLogResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
