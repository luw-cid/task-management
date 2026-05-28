package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // get all user's notification (pagination)
    Page<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    // Mark all as read
    @Modifying
    @Query("""
            UPDATE Notification n SET n.isRead = true
            WHERE n.id = :id AND n.user.id = :userId
    """)
    void markAsReadByIdAndUserId(
            @Param("id") Long id,
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
        UPDATE Notification n SET n.isRead = true
        WHERE n.user.id = :userId
""")
    void markAllAsReadByUserId(@Param("userId") Long id);
}
