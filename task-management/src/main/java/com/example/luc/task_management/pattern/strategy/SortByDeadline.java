package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.Task;

import java.util.Comparator;
import java.util.List;

public class SortByDeadline implements TaskSortStrategy{
    @Override
    public List<Task> sort(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator.comparing(
                        Task::getDeadline,
                        Comparator.nullsLast(Comparator.naturalOrder())     // Task khong co deadline xep cuoi
                )).toList();
    }
}
