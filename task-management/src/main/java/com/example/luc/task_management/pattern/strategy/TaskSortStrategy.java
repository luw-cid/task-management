package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.Task;

import java.util.List;

public interface TaskSortStrategy {
    List<Task> sort(List<Task> tasks);
}
