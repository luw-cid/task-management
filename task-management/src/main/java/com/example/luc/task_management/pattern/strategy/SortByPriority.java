package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.enums.TaskPriority;

import java.util.Comparator;
import java.util.List;

public class SortByPriority implements TaskSortStrategy{

    @Override
    public List<Task> sort(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator.comparing(
                        task -> priorityOrder(task.getPriority())
                ))
                .toList();
    }

    private int priorityOrder(TaskPriority priority) {
        return switch (priority) {
            case CRITICAL    -> 0;
            case HIGH        -> 1;
            case MEDIUM      -> 2;
            case LOW         -> 3;
        };
    }
}
