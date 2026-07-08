package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.board.CreateBoardRequest;
import com.example.luc.task_management.dto.request.board.InviteMemberRequest;
import com.example.luc.task_management.dto.request.board.UpdateBoardRequest;
import com.example.luc.task_management.dto.response.BoardMemberResponse;
import com.example.luc.task_management.dto.response.BoardResponse;
import com.example.luc.task_management.entity.Board;
import com.example.luc.task_management.entity.BoardMember;
import com.example.luc.task_management.entity.ColumnEntity;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.BoardRole;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.BoardMemberRepository;
import com.example.luc.task_management.repository.BoardRepository;
import com.example.luc.task_management.repository.ColumnRepository;
import com.example.luc.task_management.repository.UserRepository;
import com.example.luc.task_management.util.SecurityUtils;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
//import jakarta.transaction.Transactional;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public BoardResponse createBoard(CreateBoardRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        // Tạo board mới
        Board board = Board.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(currentUser)
                .isArchived(false)
                .build();
        boardRepository.save(board);

        // Tựu động thêm owner vào board với role BOARD_ADMIN
        BoardMember ownerMember = BoardMember.builder()
                .board(board)
                .user(currentUser)
                .role(BoardRole.BOARD_ADMIN)
                .build();
        boardMemberRepository.save(ownerMember);

        // tự động tạo 3 cột mặc định
        createDefaultColumn(board);

        log.info("Board created: {} by {}", board.getName(), currentUser.getEmail());
        return BoardResponse.fromEntity(board);
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> getMyBoards() {
        User currentUser = SecurityUtils.getCurrentUser();
        return boardRepository.findAllBoardsByUser(currentUser)
                .stream()
                .map(BoardResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    @Transactional( readOnly = true)
    public BoardResponse getBoardById(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException((ErrorCode.BOARD_NOT_FOUND)));

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException((ErrorCode.FORBIDDEN));
        }

        return BoardResponse.fromEntity(board);
    }

    @Transactional
    public BoardResponse updateBoard(Long boardId, UpdateBoardRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        // Ch update field nào có giá trị
        if (request.getName() != null) {
            board.setName(request.getName());
        }
        if (request.getDescription() != null) {
            board.setDescription(request.getDescription());
        }
        boardRepository.save(board);
        return BoardResponse.fromEntity(board);
    }

    @Transactional
    public void deleteBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        boardRepository.delete(board);
        log.info("Board deleted: {} by {}", board.getName(), currentUser.getEmail());
    }

    @Transactional
    public BoardMemberResponse inviteMember(Long boardId, InviteMemberRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        User invitedUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (boardMemberRepository.existsByBoardAndUser(board, invitedUser)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // add new member
        BoardMember member = BoardMember.builder()
                .board(board)
                .user(invitedUser)
                .role(request.getRole())
                .build();
        boardMemberRepository.save(member);

        // Gửi thông báo cho người được mời
        notificationService.sendNotification(
                invitedUser,
                "New Board Invitation",
                String.format("You have been invited to join the board: %s", board.getName()),
                NotificationType.BOARD_INVITED,
                board.getId(),
                ReferenceType.BOARD
        );

        log.info("Member invited: {} to board {}", invitedUser.getEmail(), board.getName());
        return BoardMemberResponse.fromEntity(member);
    }

    @Transactional
    public void removeMember(Long boardId, Long userId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        // can't delete member
        if (board.getOwner().getId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        User memberToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boardMemberRepository.deleteByBoardAndUser(board, memberToRemove);
        log.info("Member removed: {} from board {}", memberToRemove.getEmail(), board.getName());
    }

    @Transactional(readOnly = true)
    public List<BoardMemberResponse> getBoardMembers(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        if (!boardRepository.isUserInBoard(boardId, currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return boardMemberRepository.findAllByBoard(board)
                .stream()
                .map(BoardMemberResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> getArchivedBoards() {
        User currentUser = SecurityUtils.getCurrentUser();
        return boardRepository.findArchivedBoardsByUser(currentUser)
                .stream()
                .map(BoardResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void archiveBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        // Check if the board has been archived
        if (board.getIsArchived()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        board.setIsArchived(true);
        boardRepository.save(board);
        log.info("Board archived: {} by {}", board.getName(), currentUser.getEmail());
    }

    @Transactional
    public void unarchiveBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        Board board = getBoardAndCheckAdmin(boardId, currentUser);

        // Check if the board has been archived
        if (!board.getIsArchived()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        board.setIsArchived(false);
        boardRepository.save(board);

        log.info("Board unarchived: {} by {}", board.getName(), currentUser.getEmail());
    }

    private Board getBoardAndCheckAdmin(Long boardId, User user) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BOARD_NOT_FOUND));

        // Chỉ owner hoặc boadrd_admin mới được thực hiện
        boolean isAdmin = board.getOwner().getId().equals(user.getId()) ||
                boardMemberRepository.findByBoardAndUser(board, user)
                        .map(m -> m.getRole() == BoardRole.BOARD_ADMIN)
                        .orElse(false);

        if (!isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }


        return board;
    }

    private void createDefaultColumn(Board board) {
        List<String> defaultColumns = List.of("To Do", "In Progress", "Done");
        for (int i = 0; i < defaultColumns.size(); i++) {
            ColumnEntity column = ColumnEntity.builder()
                    .board(board)
                    .name(defaultColumns.get(i))
                    .position(i + 1)
                    .build();
            columnRepository.save(column);
        }
    }
}
