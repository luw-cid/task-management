package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.comment.CreateCommentRequest;
import com.example.luc.task_management.dto.request.comment.UpdateCommentRequest;
import com.example.luc.task_management.dto.response.CommentResponse;
import com.example.luc.task_management.entity.Comment;
import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.pattern.observer.comment.CommentObserver;
import com.example.luc.task_management.repository.BoardRepository;
import com.example.luc.task_management.repository.CommentRepository;
import com.example.luc.task_management.repository.TaskRepository;
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
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final CommentObserver commentObserver;

    @Transactional
    public CommentResponse addComment(Long boardId, Long taskId, CreateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Comment comment = Comment.builder()
                .task(task)
                .user(currentUser)
                .content(request.getContent())
                .isEdited(false)
                .build();
        commentRepository.save(comment);

        commentObserver.onCommentAdded(comment);

        log.info("Comment added it task {} by: {}", task.getTitle(), currentUser.getEmail());
        return CommentResponse.fromEntity(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long boardId, Long taskId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);
        return commentRepository
                .findAllByTaskIdOrderByCreatedAtAsc(taskId, pageable)
                .stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse updateComment(Long boardId, Long taskId, Long commentId, UpdateCommentRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Lấy comment và kiểm tra quyền
        // Chỉ người tạo mới đc sửa
        Comment comment = commentRepository.findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        commentRepository.save(comment);

        return CommentResponse.fromEntity(comment);
    }

    @Transactional
    public void deleteComment(Long boardId, Long taskId, Long commentId) {
        User currentUser = SecurityUtils.getCurrentUser();
        checkBoardMember(boardId, currentUser);

        Task task = taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        Comment comment = commentRepository.findByIdAndTaskId(commentId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        boolean isOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = boardRepository.findById(boardId)
                .map(board -> board.getOwner().getId().equals(currentUser.getId()))
                .orElse(false);

        if ( !isOwner && !isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        commentRepository.delete(comment);
        log.info("Comment deleted: {} by: {}", commentId, currentUser.getEmail());
    }

    private void checkBoardMember(Long boardId, User user) {
        if (boardRepository.isUserInBoard(boardId, user.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }
}
