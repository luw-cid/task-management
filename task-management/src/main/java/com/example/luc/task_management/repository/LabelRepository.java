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
        SELECT COUNT(*) > 0 FROM task_labels
        WHERE task_id = :taskId AND label_id = :labelId
        """, nativeQuery = true)
    boolean existsTaskLabel(
            @Param("taskId") Long taskId,
            @Param("labelId") Long labelId
    );

    // Thêm nhãn vào task
    @Modifying
    @Query(value = """
        INSERT INTO task_labels (task_id, label_id)
        VALUES (:taskId, :labelId)
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

}
