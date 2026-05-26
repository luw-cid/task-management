package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.Task;

import java.util.Comparator;
import java.util.List;

public class SortByCreatedAt implements TaskSortStrategy{

    @Override
    public List<Task> sort(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator.comparing(
                        Task::getCreatedAt,
                        Comparator.reverseOrder()
                )).toList();
    }
}
