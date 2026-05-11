package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.ColumnEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColumnRepository extends JpaRepository<ColumnEntity, Long> {
    List<ColumnEntity> findAllByBoardIdOrderByPositionAsc(Long boardId);

    Optional<ColumnEntity> findByIdAndBoardId(Long id, Long boardId);

    boolean existsByBoardIdAndName(Long boardId, String name);

    // Lấy vị trí lớn nhất trong board để thêm cột mới vào cuối
    @Query("SELECT MAX(c.position) FROM ColumnEntity c WHERE c.board.id = :boardId")
    Optional<Integer> findMaxPositionByBoardId(@Param("boardId") Long boardId);

    // Cập nhật vị trí hàng loạt
    @Modifying
    @Query("""
        UPDATE ColumnEntity c SET c.position = :position
        WHERE c.id = :id
    """)
    void updatePosition(
            @Param("id") Long id,
            @Param("position") int position
    );

    long countByBoardId(Long boardId);
}
