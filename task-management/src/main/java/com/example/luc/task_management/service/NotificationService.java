package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.response.NotificationResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mysql.Notification;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.NotificationType;
import com.example.luc.task_management.enums.ReferenceType;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.NotificationRepository;
import com.example.luc.task_management.util.SecurityUtils;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
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
    private final WebSocketBroadcaster webSocketBroadcaster;

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

        Notification notification = notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);

            // Gửi WebSocket cập nhật lại Badge Count chưa đọc ở Client thời gian thực
            broadcastUnreadCount(currentUser);        }
    }

    // đánh dấu tất cả thông báo đã đọc
    @Transactional
    public void markAllAsRead() {
        User currentUser = SecurityUtils.getCurrentUser();
        notificationRepository.markAllAsReadByUserId(currentUser.getId());
        log.info("Marked all notification as read for user: {}", currentUser.getEmail());

        // Gửi WebSocket cập nhật Badge Count về 0 ngay lập tức mà không cần F5
        broadcastUnreadCount(currentUser);
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

        boolean wasUnread = !notification.getIsRead();
        notificationRepository.delete(notification);

        // Nếu xóa một thông báo chưa kịp đọc, cập nhật lại số lượng badge
        if (wasUnread) {
            broadcastUnreadCount(currentUser);
        }
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

        // ★ WEBSOCKET – Push notification real-time
        WebSocketMessage<NotificationResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.NOTIFICATION_NEW,
                NotificationResponse.fromEntity(notification),
                null,
                "system"
        );
        webSocketBroadcaster.sendToUser(recipient.getEmail(), wsMessage);

        // Đẩy kèm cập nhật tổng số lượng count chưa đọc cho Client tăng số đỏ (+1) lên luôn
        broadcastUnreadCount(recipient);

        log.info("Notification saved + pushed to: {}", recipient.getEmail());
    }

    /**
     * Hàm Helper hỗ trợ đồng bộ số lượng tin nhắn chưa đọc lên UI thông qua WebSocket chuyên biệt
     */
    private void broadcastUnreadCount(User user) {
        Long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        WebSocketMessage<Long> countMessage = WebSocketMessage.of(
                WebSocketMessageType.NOTIFICATION_COUNT_UPDATED,
                unreadCount,
                null,
                "system"
        );
        webSocketBroadcaster.sendToUser(user.getEmail(), countMessage);
    }
}
