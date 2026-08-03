package com.example.luc.task_management.pattern.strategy;

import com.example.luc.task_management.entity.mysql.Task;

import java.util.List;

public interface TaskSortStrategy {
    List<Task> sort(List<Task> tasks);
}
