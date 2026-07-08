package com.example.luc.task_management.pattern.command;


import com.example.luc.task_management.entity.ActivityLog;
import com.example.luc.task_management.entity.Task;
import com.example.luc.task_management.entity.User;
import com.example.luc.task_management.enums.ActivityAction;
import com.example.luc.task_management.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommandInvoker {
    private final ActivityLogRepository activityLogRepository;

    // Thực thi command và tự động ghi log
    public void execute(TaskCommand command, Task task, User actor, ActivityAction action) {
        // thực hiện command
        command.execute();

        // Ghi lại lịch sử vào DB
        ActivityLog log = ActivityLog.builder()
                .board(task.getBoard())
                .task(task)
                .user(actor)
                .action(action)
                .newValue(command.getActionLog())
                .build();

        activityLogRepository.save(log);
    }
}
