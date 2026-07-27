package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.label.CreateLabelRequest;
import com.example.luc.task_management.dto.request.label.UpdateLabelRequest;
import com.example.luc.task_management.dto.response.LabelResponse;
import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.Label;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.BoardRole;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.BoardMemberRepository;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.LabelRepository;
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
public class LabelService {

    private final LabelRepository labelRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardSecurityService boardSecurityService;

    @Transactional
    public LabelResponse createLabel(Long boardId, CreateLabelRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);

        if (labelRepository.existsByBoardIdAndName(boardId, request.getName())) {
            throw new AppException(ErrorCode.LABEL_ALREADY_EXISTS);
        }

        Label label = Label.builder()
                .board(board)
                .name(request.getName())
                .color(request.getColor())
                .build();
        labelRepository.save(label);
        log.info("Label created: {} in board: {}", label.getName(), board.getName());
        return LabelResponse.fromEntity(label);
    }

    @Transactional(readOnly = true)
    public List<LabelResponse> getLabelsByBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();

        // Tất cả thành viên đều xem được nhãn
        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return labelRepository.findAllByBoardId(boardId)
                .stream()
                .map(LabelResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public LabelResponse updateLabel(Long boardId, Long labelId,
                                     UpdateLabelRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);

        Label label = labelRepository.findByIdAndBoardId(labelId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        // Kiểm tra tên mới có trùng với nhãn khác không
        if (request.getName() != null
                && !request.getName().equals(label.getName())
                && labelRepository.existsByBoardIdAndName(boardId, request.getName())) {
            throw new AppException(ErrorCode.LABEL_ALREADY_EXISTS);
        }

        if (request.getName() != null) label.setName(request.getName());
        if (request.getColor() != null) label.setColor(request.getColor());

        labelRepository.save(label);
        log.info("Label updated: {} in board: {}", label.getName(), boardId);

        return LabelResponse.fromEntity(label);
    }

    @Transactional
    public void deleteLabel(Long boardId, Long labelId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);

        Label label = labelRepository.findByIdAndBoardId(labelId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        // Xóa liên kết trong ở bảng trong gian task_lables
        labelRepository.deleteFromTaskLabel(labelId);

        // Xóa label
        labelRepository.delete(label);

        log.info("Label deleted: {} from board: {}", labelId, boardId);
    }

    // THÊM NHÃN VÀO TASK
    @Transactional
    public void addLabelToTask(Long boardId, Long taskId, Long labelId) {
        User currentUser = SecurityUtils.getCurrentUser();

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Kiểm tra nhãn có thuộc board không
        labelRepository.findByIdAndBoardId(labelId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        // Kiểm tra đã gán chưa
        if (labelRepository.countTaskLabel(taskId, labelId) > 0) {
            return; // Đã có rồi, bỏ qua
        }

        labelRepository.addTaskLabel(taskId, labelId);
        log.info("Label {} added to task {}", labelId, taskId);
    }

    // XÓA NHÃN KHỎI TASK
    @Transactional
    public void removeLabelFromTask(Long boardId, Long taskId, Long labelId) {
        User currentUser = SecurityUtils.getCurrentUser();

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        labelRepository.removeTaskLabel(taskId, labelId);
        log.info("Label {} removed from task {}", labelId, taskId);
    }


//    private Board getBoardAndCheckAdmin(Long boardId, User user) {
//        Board board = boardRepository.findById(boardId)
//                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));
//
//        boolean isAdmin = board.getOwner().getId().equals(user.getId()) ||
//                boardMemberRepository.findByBoardAndUser(board, user)
//                        .map(m -> m.getRole() == BoardRole.BOARD_ADMIN)
//                        .orElse(false);
//
//        if (!isAdmin) {
//            throw new AppException(ErrorCode.FORBIDDEN);
//        }
//
//        return board;
//    }
}
