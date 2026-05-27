package com.example.luc.task_management.pattern.observer.task;

import com.example.luc.task_management.entity.Task;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskEvenPublisher {
    // Spring tự inject tất cả class implements TaskObserver
    private final List<TaskObserver> observers;

    // Kích hoạt tất cả các observer khi có sự kiện
    public void publish(Task task, String evenType, String message) {
        observers.forEach(observer ->
                observer.onTaskEven(task, evenType, message));
    }
}
