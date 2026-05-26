package com.example.luc.task_management.pattern.command;

public interface TaskCommand {
    void execute();  // thực thi hành động
    String getActionLog(); // M tả hành động để ghi log
}
