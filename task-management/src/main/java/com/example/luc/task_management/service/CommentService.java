package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.comment.CreateCommentRequest;
import com.example.luc.task_management.dto.request.comment.UpdateCommentRequest;
import com.example.luc.task_management.dto.response.CommentResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mongo.Comment;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.pattern.observer.CommentObserver;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.mongo.CommentRepository;
import com.example.luc.task_management.util.SecurityUtils;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final WebSocketBroadcaster webSocketBroadcaster;
    private final CommentRepository mongoCommentRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final CommentObserver commentObserver;
    private final BoardSecurityService boardSecurityService;

    public CommentResponse addComment(Long boardId, Long taskId, CreateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        Comment comment = Comment.builder()
                .taskId(taskId)
                .boardId(boardId)
                .userId(currentUser.getId())
                .userFullName(currentUser.getFullName())
                .userEmail(currentUser.getEmail())
                .userAvatar(currentUser.getAvatarUrl())
                .content(request.getContent())
                .isEdited(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        mongoCommentRepository.save(comment);

        CommentResponse response = CommentResponse.fromDocument(comment);

        // Thông báo cho assignee + reporter
        commentObserver.onCommentAdded(comment);

        // ★ WEBSOCKET – Broadcast comment mới tới tất cả người đang xem task này real-time
        WebSocketMessage<CommentResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.COMMENT_ADDED,
                response,
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);

        log.info("Comment added to task {} by: {}", task.getTitle(), currentUser.getEmail());
        return response;
    }

    public List<CommentResponse> getComments(Long boardId, Long taskId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return mongoCommentRepository
                .findAllByTaskId(taskId, pageable)
                .stream()
                .map(CommentResponse::fromDocument)
                .collect(Collectors.toList());
    }

    public CommentResponse updateComment(Long boardId, Long taskId, String commentId, UpdateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Comment comment = mongoCommentRepository.findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!comment.getUserId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());
        mongoCommentRepository.save(comment);

        CommentResponse response = CommentResponse.fromDocument(comment);

        WebSocketMessage<CommentResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.COMMENT_UPDATED,
                response,
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);

        return response;
    }

    public void deleteComment(Long boardId, Long taskId, String commentId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Comment comment = mongoCommentRepository.findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        boolean isOwner = comment.getUserId().equals(currentUser.getId());
        boolean isAdmin = boardRepository.findById(boardId)
                .map(board -> board.getOwner().getId().equals(currentUser.getId()))
                .orElse(false);

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        mongoCommentRepository.delete(comment);

        WebSocketMessage<String> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.COMMENT_DELETED,
                commentId,
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);
    }

    public void deleteAllByTask(Long taskId) {
        mongoCommentRepository.deleteAllByTaskId(taskId);
        log.info("All comments deleted for task: {}", taskId);
    }
}
