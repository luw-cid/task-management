package com.example.luc.task_management.pattern.factory;

import com.example.luc.task_management.enums.TaskType;

public class TaskFactory {

    // Không cho khởi tạo instance vì chỉ dùng static method
    private TaskFactory() {}

    public static TaskProduct createTask(TaskType type) {
        return switch (type) {
            case BUG            -> new BugTask();
            case FEATURE        -> new FeatureTask();
            case IMPROVEMENT    -> new ImprovementTask();
            case EPIC           -> new EpicTask();
        };
    }
}
