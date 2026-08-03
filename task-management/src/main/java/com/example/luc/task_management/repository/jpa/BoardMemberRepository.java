package com.example.luc.task_management.repository.jpa;

import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.BoardMember;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.BoardRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    Optional<BoardMember> findByBoardAndUser(Board board, User user);

    Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);

    List<BoardMember> findAllByBoard(Board board);

    boolean existsByBoardAndUser(Board board, User user);

    void deleteByBoardAndUser(Board board, User user);

    // Lấy role của user trong board
    @Query("""
        SELECT bm.role FROM BoardMember bm
        WHERE bm.board.id = :boardId
        AND bm.user.id = :userId
    """)
    Optional<BoardRole> findRoleByBoardIdAndUserId(
            @Param("boardId") Long boardId,
            @Param("userId") Long userId
    );

    // Đếm số thành viên trong board
    long countByBoard(Board board);
}
