package com.example.luc.task_management.repository.jpa;

import com.example.luc.task_management.entity.mysql.ActivityLog;
import com.example.luc.task_management.enums.ActivityAction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // History by task
    List<ActivityLog> findAllByTaskIdOrderByCreatedAtDesc(Long taskId);

    // History by board (pagination)
    List<ActivityLog> findAllByBoardIdOrderByCreatedAtDesc(Long boardId, Pageable pageable);

    // History by board and action
    List<ActivityLog> findAllByBoardIdAndActionOrderByCreatedAtDesc(Long boardId, ActivityAction action);

}
