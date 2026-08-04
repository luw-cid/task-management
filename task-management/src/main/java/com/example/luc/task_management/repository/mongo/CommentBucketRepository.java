package com.example.luc.task_management.repository.mongo;

import com.example.luc.task_management.entity.mongo.item.CommentBucket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentBucketRepository extends MongoRepository<CommentBucket, String> {

    Optional<CommentBucket> findFirstByTaskIdOrderByBucketIndexDesc(Long taskId);

    Optional<CommentBucket> findByTaskIdAndBucketIndex(Long taskId, int bucketIndex);

    void deleteAllByTaskId(Long taskId);
}
