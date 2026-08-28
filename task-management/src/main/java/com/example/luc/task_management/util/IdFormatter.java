package com.example.luc.task_management.util;

public class IdFormatter {

    public static String formatUserId(Long id) {
        return id == null ? null : String.format("U%05d", id);
    }

    public static String formatBoardId(Long id) {
        return id == null ? null : String.format("B%05d", id);
    }

    public static String formatColumnId(Long id) {
        return id == null ? null : String.format("C%05d", id);
    }

    public static String formatTaskId(Long id) {
        return id == null ? null : String.format("T%05d", id);
    }

    public static String formatSubtaskId(Long id) {
        return id == null ? null : String.format("ST%05d", id);
    }

    public static String formatCommentId(Long id) {
        return id == null ? null : String.format("CM%05d", id);
    }

    public static String formatLabelId(Long id) {
        return id == null ? null : String.format("L%05d", id);
    }

    public static String formatNotificationId(Long id) {
        return id == null ? null : String.format("N%05d", id);
    }

    public static String formatActivityLogId(Long id) {
        return id == null ? null : String.format("AL%05d", id);
    }

    // Parse String ID → Long (dùng khi nhận từ request, ví dụ: "T00001" -> 1L)
    public static Long parseId(String formattedId) {
        if (formattedId == null || formattedId.isBlank()) return null;

        try {
            return Long.parseLong(formattedId.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Alias hỗ trợ typo cũ nếu có
    public static Long pasreId(String formattedId) {
        return parseId(formattedId);
    }
}
