package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.response.NotificationResponse;
import com.example.luc.task_management.entity.Notification;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.NotificationRepository;
import com.example.luc.task_management.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Lấy danh sách thông báo có phân trang
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        return notificationRepository
                .findAllByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Đếm số thông báo chưa đọc
    @Transactional(readOnly = true)
    public Long countUnread() {

        User currentUser = SecurityUtils.getCurrentUser();

        return notificationRepository.countByUserIdAndIsReadFalse(currentUser.getId());
    }

    // Đánh dấu 1 thông báo đã đọc
    @Transactional
    public void markAsRead(Long notificationId) {
        User currentUser = SecurityUtils.getCurrentUser();
        notificationRepository.markAsReadByIdAndUserId(notificationId, currentUser.getId());
    }

    // đánh dấu tất cả thông báo đã đọc
    @Transactional
    public void markAllAsRead() {
        User currentUser = SecurityUtils.getCurrentUser();
        notificationRepository.markAllAsReadByUserId(currentUser.getId());
        log.info("Marked all notification as read for user: {}", currentUser.getEmail());
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        User currentUser = SecurityUtils.getCurrentUser();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // Chỉ xóa thông báo của mình
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        notificationRepository.delete(notification);
    }

    // ─────────────────────────────────────────
    // GỬI THÔNG BÁO – Dùng nội bộ trong hệ thống
    // Được gọi bởi Observer khi có sự kiện
    // ─────────────────────────────────────────
    @Transactional
    public void sendNotification (User recipient, String title, String message, NotificationType type, Long referenceId, ReferenceType referenceType) {
        // Không gửi thông báo cho chính mình
        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Notification sent to: {} type: {}", recipient.getEmail(), type);
    }
}
