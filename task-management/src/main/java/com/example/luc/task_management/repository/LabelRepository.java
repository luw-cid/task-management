package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    List<Label> findAllByBoardId(Long boardId);

    Optional<Label> findByIdAndBoardId(Long id, Long boardId);

    boolean existsByBoardIdAndName(Long boardId, String name);

    // Kiểm tra task đã có nhãn chưa
    @Query(value = """
        SELECT COUNT(*) FROM task_labels
        WHERE task_id = :taskId AND label_id = :labelId
        """, nativeQuery = true)
    long countTaskLabel(
            @Param("taskId") Long taskId,
            @Param("labelId") Long labelId
    );

    // Thêm nhãn vào task
    @Modifying
    @Query(value = """
        INSERT INTO task_labels (task_id, label_id, created_at, update_at, updated_at)
        VALUES (:taskId, :labelId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, nativeQuery = true)
    void addTaskLabel(
            @Param("taskId") Long taskId,
            @Param("labelId") Long labelId
    );

    // Xóa nhãn khỏi task
    @Modifying
    @Query(value = """
        DELETE FROM task_labels
        WHERE task_id = :taskId AND label_id = :labelId
        """, nativeQuery = true)
    void removeTaskLabel(
            @Param("taskId") Long taskId,
            @Param("labelId") Long labelId
    );

    // Xóa tất cả các liên kết của labels trong task_labels trước khi xóa label
    // Xóa tất cả các liên kết của nhãn trong bảng task_labels trước khi xóa nhãn
    @Modifying
    @Query(value = """
        DELETE FROM task_labels
        WHERE label_id = :labelId
        """, nativeQuery = true)
    void deleteFromTaskLabel(@Param("labelId") Long labelId);


}
