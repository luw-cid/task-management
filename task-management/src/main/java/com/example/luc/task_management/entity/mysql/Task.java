package com.example.luc.task_management.entity.mysql;

import com.example.luc.task_management.enums.TaskPriority;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.enums.TaskType;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks", indexes = {
        @Index(name = "idx_tasks_board_id",    columnList = "board_id"),
        @Index(name = "idx_tasks_column_id",   columnList = "column_id"),
        @Index(name = "idx_tasks_assignee_id", columnList = "assignee_id"),
        @Index(name = "idx_tasks_deadline",    columnList = "deadline")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private ColumnEntity column;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskType type = TaskType.FEATURE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.TODO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(nullable = false)
    private Integer position = 0;

    // Relationships
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<Subtask> subtasks = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_labels",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @Builder.Default
    private List<Label> labels = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ActivityLog> activityLogs = new ArrayList<>();

    // Helper method – tính % hoàn thành subtask
    public int getCompletionPercentage() {
        if (subtasks == null || subtasks.isEmpty()) return 0;
        long completed = subtasks.stream()
                .filter(Subtask::getIsCompleted)
                .count();
        return (int) ((completed * 100) / subtasks.size());
    }
}
