package com.example.luc.task_management.service;

import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.BoardMember;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.BoardRole;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.BoardMemberRepository;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BoardSecurityService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;

    public Board getBoardAndCheckAdmin(Long boardId, User currentUser) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        BoardMember member = boardMemberRepository.findByBoardAndUser(board, currentUser)
                .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));

        // 1. Kiểm tra xem user hiện tại có phải chủ bảng (Owner) hay không
        boolean isOwner = board.getOwner().getId().equals(currentUser.getId());

        if (!isOwner && member.getRole() != BoardRole.BOARD_ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return board;
    }

    public void checkBoardMember(Long boardId, User currentUser) {
        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    public void checkBoardNotArchive(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        if (board.getIsArchived()) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }
}
