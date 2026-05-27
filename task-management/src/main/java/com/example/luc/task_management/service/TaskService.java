package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.task.AssignTaskRequest;
import com.example.luc.task_management.dto.request.task.CreateTaskRequest;
import com.example.luc.task_management.dto.request.task.MoveTaskRequest;
import com.example.luc.task_management.dto.request.task.UpdateTaskRequest;
import com.example.luc.task_management.dto.response.TaskResponse;
import com.example.luc.task_management.entity.*;
import com.example.luc.task_management.enums.ActivityAction;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.pattern.command.AssignTaskCommand;
import com.example.luc.task_management.pattern.command.CommandInvoker;
import com.example.luc.task_management.pattern.command.MoveTaskCommand;
import com.example.luc.task_management.pattern.command.UpdateTaskCommand;
import com.example.luc.task_management.pattern.factory.TaskFactory;
import com.example.luc.task_management.pattern.factory.TaskProduct;
import com.example.luc.task_management.pattern.observer.task.TaskEvenPublisher;
import com.example.luc.task_management.pattern.strategy.TaskSortContext;
import com.example.luc.task_management.repository.*;
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
public class TaskService {

    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserRepository userRepository;
    private final CommandInvoker commandInvoker;
    private final TaskEvenPublisher taskEvenPublisher;

    // ─────────────────────────────────────────
    // TẠO TASK – Dùng Factory Pattern
    // ─────────────────────────────────────────
    @Transactional
    public TaskResponse createTask(Long boardId, CreateTaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        ColumnEntity column = columnRepository.findByIdAndBoardId(request.getColumnId(), boardId)
                .orElseThrow(() -> new AppException(ErrorCode.COLUMN_NOT_FOUND));

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        // ★ FACTORY PATTERN
        // Dùng TaskFactory tạo đúng loại task
        TaskProduct taskProduct = TaskFactory.createTask(request.getType());

        // Lấy vị trí tiếp theo trong column
        int nextPosition = taskRepository.findMaxPositionByColumnId(column.getId())
                .orElse(0) + 1;

        // Lấy assignee (nếu có)
        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }

        // Tạo task với Priority mặc định từ Factory
        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .priority(taskProduct.getDefaultPriority())
                .status(TaskStatus.TODO)
                .column(column)
                .board(board)
                .assignee(assignee)
                .reporter(currentUser)
                .deadline(request.getDeadline())
                .position(nextPosition)
                .build();

        taskRepository.save(task);

        // Ghi log tạo task
        ActivityLog activityLog = ActivityLog.builder()
                .board(board)
                .task(task)
                .user(currentUser)
                .action(ActivityAction.TASK_CREATED)
                .newValue(task.getTitle())
                .build();

        // Nếu có asignee -> Bbserver thông báo
        if (assignee != null) {
            taskEvenPublisher.publish(
                    task,
                    "TASK_ASSIGNED",
                    String.format("You have been assigned to the task: %s", task.getTitle()));
        }

        log.info("Task created: {} type: {}", task.getTitle(), task.getType());
        return TaskResponse.fromEntity(task, taskProduct.getColor());
    }



    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByBoard(Long boardId, String sortBy) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        List<Task> tasks = taskRepository.findAllByBoardIdOrderByCreatedAtDesc(boardId);
        // ★ STRATEGY PATTERN
        // Chọn cách sắp xếp tại runtime dựa vào tham số sortBy
        TaskSortContext sortContext = TaskSortContext.of(sortBy);
        List<Task> sortedTasks = sortContext.sort(tasks);

        return sortedTasks.stream()
                .map(task -> {
                    TaskProduct taskProduct = TaskFactory.createTask(task.getType());
                    return TaskResponse.fromEntity(task, taskProduct.getColor());
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TaskResponse> getTasksByColumn (Long boardId, Long columnId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        List<Task> tasks = taskRepository.findAllByColumnIdOrderByPositionAsc(columnId);


        return tasks.stream()
                .map(task -> {
                    TaskProduct product = TaskFactory.createTask(task.getType());
                    return TaskResponse.fromEntity(task, product.getColor());
                }).collect(Collectors.toList());
    }

    @Transactional (readOnly = true)
    public TaskResponse getTaskById(Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException((ErrorCode.TASK_NOT_FOUND)));

        TaskProduct product = TaskFactory.createTask(task.getType());
        return TaskResponse.fromEntity(task, product.getColor());
    }

    @Transactional
    public TaskResponse updateTask(Long boardId, Long taskId, UpdateTaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        UpdateTaskCommand command = new UpdateTaskCommand(
                task,
                request.getTitle(),
                request.getDescription(),
                request.getPriority()
        );

        commandInvoker.execute(command, task, currentUser, ActivityAction.TASK_UPDATED);

        // update deadline riêng nếu có
        if (request.getDeadline() != null) {
            task.setDeadline(request.getDeadline());
        }

        taskRepository.save(task);

        // Observer thông báo
        taskEvenPublisher.publish(
                task,
                "TASK_UPDATE",
                String.format("Task '%s' is updated", task.getTitle())
        );

        TaskProduct product = TaskFactory.createTask(task.getType());
        return TaskResponse.fromEntity(task, product.getColor());
    }

    @Transactional
    public TaskResponse moveTask(Long boardId, Long taskId, MoveTaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        ColumnEntity newColumn = columnRepository.findByIdAndBoardId(request.getColumnId(), boardId)
                .orElseThrow(() -> new AppException(ErrorCode.COLUMN_NOT_FOUND));

        MoveTaskCommand command = new MoveTaskCommand(
                task,
                newColumn,
                request.getStatus()
        );

        commandInvoker.execute(command, task, currentUser, ActivityAction.TASK_MOVED);

        taskRepository.save(task);

        // Observer thông báo
        taskEvenPublisher.publish(
                task,
                "TASK_MOVE",
                String.format("Task '%s is moved to '%s'", task.getTitle(), newColumn.getName())
        );

        TaskProduct product = TaskFactory.createTask(task.getType());
        return TaskResponse.fromEntity(task, product.getColor());
    }

    // Gán người thực hiện task
    public TaskResponse assignTask(Long boardId, Long taskId, AssignTaskRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(boardId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        User newAssignee = null;
        if (request.getAssigneeId() != null) {
            newAssignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }

        AssignTaskCommand command = new AssignTaskCommand(task, newAssignee);
        commandInvoker.execute(command, task, currentUser, ActivityAction.TASK_ASSIGNED);

        taskRepository.save(task);

        // observer auto thông báo cho người đc gán
        if (newAssignee != null) {
            taskEvenPublisher.publish(
                    task,
                    "TASK_ASSIGNED",
                    String.format("You have been assigned to the task '%s'", task.getTitle())
            );
        }

        TaskProduct product = TaskFactory.createTask(task.getType());
        return TaskResponse.fromEntity(task, product.getColor());
    }

    @Transactional
    public void deleteTask (Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        taskRepository.delete(task);
        log.info("Task deleted: {} by {}", task.getTitle(), currentUser.getEmail());
    }

    private void checkBoardMember(Long boardId, User user) {
        if (!boardRepository.isUserInBoard(boardId, user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }
}
