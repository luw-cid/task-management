package com.example.luc.task_management.service;


import com.example.luc.task_management.dto.request.column.CreateColumnRequest;
import com.example.luc.task_management.dto.request.column.UpdateColumnRequest;
import com.example.luc.task_management.dto.response.ColumnResponse;
import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.ColumnEntity;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.BoardRole;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.BoardMemberRepository;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.ColumnRepository;
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
public class ColumnService {

    private final ColumnRepository columnRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardSecurityService boardSecurityService;

    @Transactional
    public ColumnResponse createColumn(Long boardId, CreateColumnRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);
        boardSecurityService.checkBoardNotArchive(boardId);

        if (columnRepository.existsByBoardIdAndName(boardId, request.getName())) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // lấy vị trí tiếp theo (thêm vào cuối)
        int nextPosition = columnRepository.findMaxPositionByBoardId(boardId).orElse(0) + 1;

        ColumnEntity column = ColumnEntity.builder()
                .board(board)
                .name(request.getName())
                .position(nextPosition)
                .build();

        columnRepository.save(column);
        log.info("Column created: {} in board {}", column.getName(), board.getName());

        return ColumnResponse.fromEntity(column);
    }

    @Transactional(readOnly = true)
    public List<ColumnResponse> getColumnsByBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        
        // Kiểm tra board tồn tại
        boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return columnRepository.findAllByBoardIdOrderByPositionAsc(boardId)
                .stream()
                .map(ColumnResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ColumnResponse updateColumn(Long boardId, Long columnId, UpdateColumnRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);

        ColumnEntity column = columnRepository.findByIdAndBoardId(columnId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.COLUMN_NOT_FOUND));

        // Cập nhật tên (nếu có)
        if (request.getName() != null) {
            column.setName(request.getName());
        }
        // Update position () neu co
        if (request.getPosition() != null) {
            reorderColumns(boardId, columnId, request.getPosition());
            column.setPosition(request.getPosition());
        }
        columnRepository.save(column);
        return ColumnResponse.fromEntity(column);
    }

    @Transactional
    public void deleteColumn(Long boardId, Long columnId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = boardSecurityService.getBoardAndCheckAdmin(boardId, currentUser);

        long countColumn = columnRepository.countByBoardId(boardId);
        if (countColumn <= 1) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        ColumnEntity column = columnRepository.findByIdAndBoardId(columnId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.COLUMN_NOT_FOUND));

        columnRepository.delete(column);
        log.info("Column deleted: {} from board {}", column.getName(), board.getName());
    }

    // HELPER xắp sếp lại vị trí column
    private void reorderColumns(Long boardId, Long movedColumnId, int newPosition) {
        List<ColumnEntity> columns = columnRepository.findAllByBoardIdOrderByPositionAsc(boardId);

        // Dịch chuyển các cột khác để nhường chỗ
        for (ColumnEntity col : columns) {
            if (col.getId().equals(movedColumnId)) continue;
            if (col.getPosition() >= newPosition) {
                col.setPosition(col.getPosition() + 1);
                columnRepository.save(col);
            }
        }
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
//        return board;
//    }
//
//    private void checkBoardNotArchive(Long boardId) {
//        Board board = boardRepository.findById(boardId)
//                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));
//
//        if (board.getIsArchived()) {
//            throw new AppException(ErrorCode.BOARD_ARCHIVED);
//        }
//    }
}
