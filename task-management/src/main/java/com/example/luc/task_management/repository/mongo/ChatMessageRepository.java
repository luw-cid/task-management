package com.example.luc.task_management.repository.mongo;

import com.example.luc.task_management.entity.mongo.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    // Lấy tin nhắn theo task (pagination)
    // isDeleted = false để ẩn tin nhắn đã xóa
    Page<ChatMessage> findAllByTaskIdAndIsDeletedFalse (Long task, Pageable pageable);

    // Lấy tin nhắn theo ID, taskId
    Optional<ChatMessage> findByIdAndTaskId(String id, Long taskId);

    // Đếm tin nhắn trong task
    long countTaskIdAndIsDeletedFalse(Long taskId);

    // xóa toàn bộ tin nhắn khi xóa task
    void deleteAllByTaskId(Long taskId);

    // Tìm kiếm trong nội dung
    @Query("{ 'taskId': ?0, 'content': { $regex: ?1, $options: 'i' }, 'isDeleted': false }")
    Page<ChatMessage> searchByContent(Long taskId, String keyword, Pageable pageable);
}
