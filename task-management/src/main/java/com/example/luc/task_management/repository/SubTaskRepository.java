package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubTaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findAllByTaskIdOrderByPositionAsc(Long taskId);

    Optional<Subtask> findByIdAndTaskId(Long id, Long taskId);

    long countByTaskId(Long taskId);
    long countByTaskiIdAndCompletedTrue(Long taskId);

    // Lấy vị trí lớn nhất
    @Query("SELECT MAX(s.position) FROM Subtask s WHERE s.task.id = :taskId")
    Optional<Integer> findMaxPositionByTaskId(@Param("taskId") Long taskId);
}
