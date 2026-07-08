package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.TaskLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, Long> {

    @Modifying
    @Query(value = "DELETE FROM task_labels WHERE task_id = :taskId AND label_id = :labelId",
            nativeQuery = true
    )
    void removeTaskLabel(@Param("taskId") Long taskId, @Param("labelId") Long labelId);

    @Query(value = "SELECT COUNT(*) FROM task_labels WHERE task_id = :taskId AND label_id = :labelId",
            nativeQuery = true)
    long countTaskLabel(
            @Param("taskId") Long taskId,
            @Param("labelId") Long labelId
    );
}
