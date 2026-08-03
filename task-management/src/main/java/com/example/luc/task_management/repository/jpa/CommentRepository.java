package com.example.luc.task_management.repository.jpa;

import com.example.luc.task_management.entity.mysql.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findAllByTaskIdOrderByCreatedAtAsc(Long taskId, Pageable pageable);

    Optional<Comment> findByIdAndTaskId(Long id, Long taskId);
    Optional<Comment> findByIdAndUserId(Long id, Long userId);
    Long countByTaskId(Long taskId);
}
