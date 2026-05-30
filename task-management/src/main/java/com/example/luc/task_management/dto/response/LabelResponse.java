package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.Label;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabelResponse {

    private Long id;
    private Long boardId;
    private String name;
    private String color;
    private int taskCount; // number of tasks using label

    public static LabelResponse fromEntity(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .boardId(label.getBoard().getId())
                .name(label.getName())
                .color(label.getColor())
                .taskCount(label.getTasks().size())
                .build();
    }
}
