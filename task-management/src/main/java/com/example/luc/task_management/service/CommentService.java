package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.comment.CreateCommentRequest;
import com.example.luc.task_management.dto.request.comment.UpdateCommentRequest;
import com.example.luc.task_management.dto.response.CommentResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mongo.Comment;
import com.example.luc.task_management.entity.mongo.item.CommentBucket;
import com.example.luc.task_management.entity.mongo.item.CommentItem;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.pattern.observer.CommentObserver;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.mongo.CommentBucketRepository;
import com.example.luc.task_management.util.SecurityUtils;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final WebSocketBroadcaster webSocketBroadcaster;
    private final CommentBucketRepository commentBucketRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final CommentObserver commentObserver;
    private final BoardSecurityService boardSecurityService;

    public CommentResponse addComment(Long boardId, Long taskId, CreateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        CommentBucket currentBucket = commentBucketRepository
                .findFirstByTaskIdOrderByBucketIndexDesc(taskId)
                .orElse(null);

        if (currentBucket == null || currentBucket.getCount() >= 50) {
            int nextIndex = (currentBucket == null) ? 0 : currentBucket.getBucketIndex() + 1;
            currentBucket = CommentBucket.builder()
                    .id("task_" + taskId + "_bucket_" + nextIndex)
                    .taskId(taskId)
                    .boardId(boardId)
                    .bucketIndex(nextIndex)
                    .count(0)
                    .startDate(LocalDateTime.now())
                    .comments(new ArrayList<>())
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        CommentItem item = CommentItem.builder()
                .id(UUID.randomUUID().toString())
                .userId(currentUser.getId())
                .userFullName(currentUser.getFullName())
                .userEmail(currentUser.getEmail())
                .userAvatar(currentUser.getAvatarUrl())
                .content(request.getContent())
                .isEdited(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        currentBucket.getComments().add(item);
        currentBucket.setCount(currentBucket.getComments().size());
        currentBucket.setEndDate(now);

        commentBucketRepository.save(currentBucket);

        CommentResponse response = CommentResponse.fromItem(item, taskId);

        // Observer compatibility
        Comment tempComment = Comment.builder()
                .id(item.getId())
                .taskId(taskId)
                .boardId(boardId)
                .userId(currentUser.getId())
                .userFullName(currentUser.getFullName())
                .userEmail(currentUser.getEmail())
                .userAvatar(currentUser.getAvatarUrl())
                .content(item.getContent())
                .isEdited(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        commentObserver.onCommentAdded(task, tempComment);

        WebSocketMessage<CommentResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.COMMENT_ADDED,
                response,
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);

        log.info("Comment added to task {} bucket by: {}", task.getTitle(), currentUser.getEmail());
        return response;
    }

    public List<CommentResponse> getComments(Long boardId, Long taskId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Optional<CommentBucket> latestBucketOpt = commentBucketRepository
                .findFirstByTaskIdOrderByBucketIndexDesc(taskId);

        if (latestBucketOpt.isEmpty()) return Collections.emptyList();

        int maxIndex = latestBucketOpt.get().getBucketIndex();
        int targetIndex = maxIndex - page;

        if (targetIndex < 0) return Collections.emptyList();

        CommentBucket bucket = commentBucketRepository
                .findByTaskIdAndBucketIndex(taskId, targetIndex)
                .orElse(null);

        if (bucket == null || bucket.getComments() == null) return Collections.emptyList();

        return bucket.getComments().stream()
                .map(item -> CommentResponse.fromItem(item, taskId))
                .collect(Collectors.toList());
    }

    public CommentResponse updateComment(Long boardId, Long taskId, String commentId, UpdateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        CommentBucket bucket = commentBucketRepository
                .findFirstByTaskIdOrderByBucketIndexDesc(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        CommentItem item = bucket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!item.getUserId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        item.setContent(request.getContent());
        item.setIsEdited(true);
        item.setUpdatedAt(LocalDateTime.now());
        commentBucketRepository.save(bucket);

        CommentResponse response = CommentResponse.fromItem(item, taskId);

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

        CommentBucket bucket = commentBucketRepository
                .findFirstByTaskIdOrderByBucketIndexDesc(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        CommentItem item = bucket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        boolean isOwner = item.getUserId().equals(currentUser.getId());
        boolean isAdmin = boardRepository.findById(boardId)
                .map(board -> board.getOwner().getId().equals(currentUser.getId()))
                .orElse(false);

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        bucket.getComments().removeIf(c -> c.getId().equals(commentId));
        bucket.setCount(bucket.getComments().size());
        commentBucketRepository.save(bucket);

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
        commentBucketRepository.deleteAllByTaskId(taskId);
        log.info("All comments deleted for task: {}", taskId);
    }
}
