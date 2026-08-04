package com.example.luc.task_management.repository.mongo;

import com.example.luc.task_management.entity.mongo.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CommentRepository extends MongoRepository<Comment, String> {

    Page<Comment> findAllByTaskId(Long taskId, Pageable pageable);

    Optional<Comment> findByIdAndTaskId(String id, Long taskId);

    void deleteAllByTaskId(Long taskId);
}
