package com.example.luc.task_management.pattern.command;

import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.entity.User;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class AssignTaskCommand implements TaskCommand{

    private final Task task;
    private final User newAssignee;
    private String oldAssigneeName;

    @Override
    public void execute() {
        // Lưu giá trị cũ trước khi thay đổi
        oldAssigneeName = task.getAssignee() != null
                ? task.getAssignee().getFullName()
                : "Chưa gán";

        task.setAssignee(newAssignee);
    }

    @Override
    public String getActionLog() {
        String newName = newAssignee != null
                ? newAssignee.getFullName()
                : "Chưa gán";

        return String.format("Assignee: %s -> %s", oldAssigneeName, newName);
    }
}
