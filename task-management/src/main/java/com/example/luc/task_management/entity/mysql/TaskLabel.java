package com.example.luc.task_management.entity.mysql;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "task_labels")
@Getter @Setter
public class TaskLabel extends BaseEntity{
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "task_id") private Task task;
    @ManyToOne @JoinColumn(name = "label_id") private Label label;
}
