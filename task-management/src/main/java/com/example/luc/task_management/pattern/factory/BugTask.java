package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskPriority;

public class BugTask implements TaskProduct {

    @Override
    public TaskPriority getDefaultPriority() {
        return TaskPriority.CRITICAL;
    }

    @Override
    public String getColor() {
        return "#ef4444"; // Màu đỏ
    }

    @Override
    public String getTypeName() {
        return "BUG";
    }
}
