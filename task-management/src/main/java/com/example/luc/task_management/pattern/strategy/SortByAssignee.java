package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.mysql.Task;

import java.util.Comparator;
import java.util.List;

public class SortByAssignee implements TaskSortStrategy{

    @Override
    public List<Task> sort(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator.comparing(
                        task -> task.getAssignee() != null
                            ? task.getAssignee().getFullName()
                            : "zzz",
                        Comparator.naturalOrder()
                )).toList();
    }
}
