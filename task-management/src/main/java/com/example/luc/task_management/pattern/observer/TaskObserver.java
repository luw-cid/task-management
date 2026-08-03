package com.example.luc.task_management.pattern.observer;

import com.example.luc.task_management.entity.mysql.Task;

public interface TaskObserver {
    void onTaskEven(Task task, String evenType, String message);
}
