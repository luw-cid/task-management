package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.enums.TaskPriority;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.enums.TaskType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findAllByColumnIdOrderByPositionAsc(Long columnId);

    List<Task> findAllByBoardIdOrderByCreatedAtDesc(Long boardId);

    Optional<Task> findByIdAndBoardId(Long id, Long boardId);

    // find task by keyword
    @Query("""
        SELECT t FROM Task t
        WHERE t.board.id = :boardId
        AND (
            LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
    """)
    Page<Task> searchByKeyword(
            @Param("boardId") Long boardId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // filter task by multiple criteria
    @Query("""
        SELECT t FROM Task t
        WHERE t.board.id = :boardId
        AND (:status IS NULL OR t.status = :status)
        AND (:type IS NULL OR t.type = :type)
        AND (:priority IS NULL OR t.priority = :priority)
        AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
    """)
    Page<Task> filterTasks(
            @Param("boardId") Long boardId,
            @Param("status") TaskStatus status,
            @Param("type") TaskType type,
            @Param("priority") TaskPriority priority,
            @Param("assigneeId") Long assigneeId,
            Pageable pageable
    );

    // get tasks that are nearing or past their deadline
    @Query("""
        SELECT t FROM Task t
        WHERE t.board.id = :boardId
        AND t.deadline IS NOT NULL
        AND t.status != 'DONE'
        AND t.deadline <= :deadline
    """)
    List<Task> findOverdueTasks(
            @Param("boardId") Long boardId,
            @Param("deadline") LocalDateTime deadline
    );

    // Task statistics by status
    @Query("""
        SELECT t.status, COUNT(t) FROM Task t
        WHERE t.board.id = :boardId
        GROUP BY t.status
    """)
    List<Object[]> countTasksByStatus(@Param("boardId") Long boardId);

    // Task statistics by assignment
    @Query("""
        SELECT t.assignee.id, t.status, COUNT(t)
        FROM Task t
        WHERE t.board.id = :boardId
        AND t.assignee IS NOT NULL
        GROUP BY t.assignee.id, t.status
    """)
    List<Object[]> countTasksByAssigneeAndStatus(@Param("boardId") Long boardId);

    // Update task location
    @Modifying
    @Query("UPDATE Task t SET t.position = :position WHERE t.id = :id")
    void updatePosition(@Param("id") Long id, @Param("position") int position);

    //Get the largest position in the column
    @Query("SELECT MAX(t.position) FROM Task t WHERE t.column.id = :columnId")
    Optional<Integer> findMaxPositionByColumnId(@Param("columnId") Long columnId);
}
