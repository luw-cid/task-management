package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Board;
import com.example.luc.task_management.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    // Get all board that the user is owner
    List<Board> findByOwnerAbdIsArchivedFalse(User owner);

    // Get all board that the user has joined (both owners and members)
    @Query("""
            SELECT DISTINCT b from Board b
            LEFT JOIN b.members bm
            WHERE (b.owner = : user OR bm.user = :user)
            AND b.isArchived = false
            ORDER BY b.createAt DESC
    """)
    List<Board> findAllBoardsByUser(@Param("user") User user);

    // Pagination
    @Query("""
            SELECT DISTINCT b from Board b
            LEFT JOIN b.members bm
            WHERE (b.owner = : user OR bm.user = :user)
            AND b.isArchived = false
            ORDER BY b.createAt DESC
    """)
    Page<Board> findAllBoardsByUserPageable(
            @Param("user") User user,
            Pageable pageable
    );

    // Check if the user belongs to the board
    @Query("""
            SELECT COUNT(b) > 0 FROM Board b
            LEFT JOIN b.members bm
            WHERE b.id = : boardId
            AND (b.owner.id = : userId OR bm.user.id =: user.id""")
    boolean isUserInBoard(
            @Param("boardId") Long boardId,
            @Param("userId") Long userId
    );
}
