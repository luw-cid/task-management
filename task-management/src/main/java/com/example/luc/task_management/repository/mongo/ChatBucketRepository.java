package com.example.luc.task_management.repository.mongo;


import com.example.luc.task_management.entity.mongo.item.ChatBucket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatBucketRepository extends MongoRepository<ChatBucket, String> {
    // Tìm bucket mới nhất của board
    Optional<ChatBucket> findFirstByBoardIdAndTaskIdIsNullOrderByBucketIndexDesc(Long boardId);

    // Tìm bucket theo index cụ thể để phân trang
    Optional<ChatBucket> findByBoardIdAndTaskIdIsNullAndBucketIndex(Long boardId, int bucketIndex);
}
