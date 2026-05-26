package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskPriority;

public interface TaskProduct {
    TaskPriority getDefaultPriority();
    String getColor();
    String getTypeName();
}
