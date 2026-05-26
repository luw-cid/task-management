package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.Task;

import java.util.List;

public class TaskSortContext {

    private TaskSortStrategy strategy;

    public TaskSortContext(TaskSortStrategy strategy) {
        this.strategy = strategy;
    }

    // Cho phép đổi strategy lúc runtime
    public void setStrategy(TaskSortStrategy strategy) {
        this.strategy = strategy;
    }

    public List<Task> sort(List<Task> tasks) {
        return strategy.sort(tasks);
    }

    // Static factory method – chọn strategy từ string
    public static TaskSortContext of(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "deadline"  -> new TaskSortContext(new SortByDeadline());
            case "priority"  -> new TaskSortContext(new SortByPriority());
            case "assignee"  -> new TaskSortContext(new SortByAssignee());
            default          -> new TaskSortContext(new SortByCreatedAt());
        };
    }
}
