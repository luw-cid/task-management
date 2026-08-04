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
    Page<ChatMessage> findAllByTaskIdAndIsDeletedFalse (Long taskId, Pageable pageable);

    // Lấy tin nhắn theo board (pagination)
    Page<ChatMessage> findAllByBoardIdAndIsDeletedFalse(Long boardId, Pageable pageable);

    // Lấy tin nhắn theo ID, taskId
    Optional<ChatMessage> findByIdAndTaskId(String id, Long taskId);

    // Lấy tin nhắn theo ID, boardId
    Optional<ChatMessage> findByIdAndBoardId(String id, Long boardId);

    // Đếm tin nhắn trong task
    long countByTaskIdAndIsDeletedFalse(Long taskId);

    // Đếm tin nhắn trong board
    long countByBoardIdAndIsDeletedFalse(Long boardId);

    // xóa toàn bộ tin nhắn khi xóa task
    void deleteAllByTaskId(Long taskId);

    // Tìm kiếm trong nội dung theo task
    @Query("{ 'taskId': ?0, 'content': { $regex: ?1, $options: 'i' }, 'isDeleted': false }")
    Page<ChatMessage> searchByContent(Long taskId, String keyword, Pageable pageable);

    // Tìm kiếm trong nội dung theo board
    @Query("{ 'boardId': ?0, 'content': { $regex: ?1, $options: 'i' }, 'isDeleted': false }")
    Page<ChatMessage> searchByBoardIdAndContent(Long boardId, String keyword, Pageable pageable);
}
