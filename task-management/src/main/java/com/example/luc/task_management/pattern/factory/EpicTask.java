package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskPriority;

public class EpicTask implements TaskProduct {

    @Override
    public TaskPriority getDefaultPriority() {
        return TaskPriority.HIGH;
    }

    @Override
    public String getColor() {
        return "#8b5cf6"; // Màu tím
    }

    @Override
    public String getTypeName() {
        return "EPIC";
    }
}
