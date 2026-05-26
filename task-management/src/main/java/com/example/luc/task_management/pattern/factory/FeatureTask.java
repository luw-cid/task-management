package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskPriority;

public class FeatureTask implements TaskProduct {

    @Override
    public TaskPriority getDefaultPriority() {
        return TaskPriority.MEDIUM;
    }

    @Override
    public String getColor() {
        return "#3b82f6"; // Màu blue
    }

    @Override
    public String getTypeName() {
        return "FEATURE";
    }
}
