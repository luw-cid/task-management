package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskPriority;

public class ImprovementTask implements TaskProduct {

    @Override
    public TaskPriority getDefaultPriority() {
        return TaskPriority.LOW;
    }

    @Override
    public String getColor() {
        return "#10b981"; // Màu xanh lá
    }

    @Override
    public String getTypeName() {
        return "IMPROVEMENT";
    }
}
