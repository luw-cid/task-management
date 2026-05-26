package com.example.luc.task_management.pattern.command;

import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.enums.TaskPriority;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UpdateTaskCommand implements TaskCommand{
    private final Task task;
    private final String newTitle;
    private final String newDescription;
    private final TaskPriority newPriority;
    private String oldTitle;

    @Override
    public void execute() {
        oldTitle = task.getTitle();

        if (newTitle != null)       task.setTitle(newTitle);
        if (newDescription != null) task.setDescription(newDescription);
        if (newPriority != null)    task.setPriority(newPriority);
    }

    @Override
    public String getActionLog() {
        return String.format("Task updated: %s", oldTitle);
    }
}
