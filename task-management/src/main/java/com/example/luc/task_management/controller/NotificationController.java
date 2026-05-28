package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.NotificationResponse;
import com.example.luc.task_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        notificationService.getMyNotifications(page, size)
                )
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread() {
        long count = notificationService.countUnread();
        return ResponseEntity.ok(
                ApiResponse.success(Map.of("unreadCount", count))
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu đã đọc", null)
        );
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(
                ApiResponse.success("Đã đánh dấu tất cả đã đọc", null)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa thông báo thành công", null)
        );
    }
}
