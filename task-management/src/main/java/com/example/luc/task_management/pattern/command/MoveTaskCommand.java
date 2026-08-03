package com.example.luc.task_management.pattern.command;

import com.example.luc.task_management.entity.mysql.ColumnEntity;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.enums.TaskStatus;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class MoveTaskCommand implements TaskCommand{

    private final Task task;
    private final ColumnEntity newColumn;
    private final TaskStatus newStatus;
    private String oldColumnName;
    private String newColumnName;

    @Override
    public void execute() {
        oldColumnName = task.getColumn().getName();
        newColumnName = newColumn.getName();

        task.setColumn(newColumn);
        task.setStatus(newStatus);
    }

    @Override
    public String getActionLog() {
        return String.format("Moved: %s -> %s", oldColumnName, newColumnName);
    }
}
