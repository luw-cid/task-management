package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.ActivityLog;
import com.example.luc.task_management.entity.Board;
import com.example.luc.task_management.enums.ActivityAction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // History by task
    List<ActivityLog> findAllByTaskIdOrderByCreateAtDesc(Long taskId);

    // History by board (pagination)
    List<Board> findAllByBoardIdOrderByCreateAtDesc(Long boardId, Pageable pageable);

    // History by board and action
    List<Board> findAllByBoardIdAndActionOrderByCreateAtDesc(Long boardId, ActivityAction action);

}
