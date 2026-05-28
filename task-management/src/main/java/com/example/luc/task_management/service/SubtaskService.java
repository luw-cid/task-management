package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.subtask.CreateSubtaskRequest;
import com.example.luc.task_management.dto.request.subtask.UpdateSubtaskRequest;
import com.example.luc.task_management.dto.response.SubtaskResponse;
import com.example.luc.task_management.entity.ActivityLog;
import com.example.luc.task_management.entity.Subtask;
import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.ActivityAction;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.ActivityLogRepository;
import com.example.luc.task_management.repository.BoardRepository;
import com.example.luc.task_management.repository.SubTaskRepository;
import com.example.luc.task_management.repository.TaskRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public SubtaskResponse createSubtask(Long boardId, Long taskId, CreateSubtaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Lấy vị trí tiếp thep
        int nextPosition = subTaskRepository
                .findMaxPositionByTaskId(taskId)
                .orElse(0) + 1;

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(request.getTitle())
                .isCompleted(false)
                .position(nextPosition)
                .build();

        subTaskRepository.save(subtask);
        // ghi log
        saveActivityLog(task, currentUser, ActivityAction.SUBTASK_CREATED ,"Create a new subtask: " + request.getTitle());

        log.info("Subtask created: {} in task {}", subtask.getTitle(), task.getTitle());

        return SubtaskResponse.fromEtity(subtask);

    }

    @Transactional(readOnly = true)
    public List<SubtaskResponse> getSubtasks(Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        return subTaskRepository.findByTaskIdOrderByPositionAsc(taskId)
                .stream()
                .map(SubtaskResponse::fromEtity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubtaskResponse updateSubtask(Long boardId, Long taskId, Long subtaskId, UpdateSubtaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Subtask subtask = subTaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // update name if exists
        if (request.getTitle() != null) {
            subtask.setTitle(request.getTitle());
        }

        // Đánh dấu hoàn thành/ chưa hoành thành
        if (request.getCompleted() != null) {
            subtask.setIsCompleted(request.getCompleted());

            // Ghi log khi hoàn thành
            if (request.getCompleted()) {
                saveActivityLog(task, currentUser, ActivityAction.SUBTASK_COMPLETED, "Subtask completed: " + subtask.getTitle());
            }
        }

        subTaskRepository.save(subtask);
        return SubtaskResponse.fromEtity(subtask);
    }

    public void deleteSubtask(Long boardId, Long taskId, Long subtaskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Subtask subtask = subTaskRepository.findByIdAndTaskId(subtaskId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        subTaskRepository.delete(subtask);
        log.info("Subtask deleted: {}", subtaskId);
    }

    private void checkBoardMember(Long boardId, User user) {
        if (!boardRepository.isUserInBoard(boardId, user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void saveActivityLog(Task task, User user, ActivityAction action, String value) {
        ActivityLog log = ActivityLog.builder()
                .board(task.getBoard())
                .task(task)
                .user(user)
                .action(action)
                .newValue(value)
                .build();
    }
}
