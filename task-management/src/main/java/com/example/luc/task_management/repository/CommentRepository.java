package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findAllByTaskIdOrderByCreateAtAsc(Long taskId);

    Optional<Comment> findByIdAndTaskId(Long id, Long taskId);
    Optional<Comment> findByIdAndUserId(Long id, Long userId);
    Long countByTaskId(Long taskId);
}
