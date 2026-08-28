package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Label;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabelResponse {

    private Long id;
    private String formattedId;      // ví dụ: "L00001"
    private Long boardId;
    private String formattedBoardId; // ví dụ: "B00001"
    private String name;
    private String color;
    private int taskCount; // number of tasks using label

    public static LabelResponse fromEntity(Label label) {
        Long bId = label.getBoard() != null ? label.getBoard().getId() : null;

        return LabelResponse.builder()
                .id(label.getId())
                .formattedId(IdFormatter.formatLabelId(label.getId()))
                .boardId(bId)
                .formattedBoardId(IdFormatter.formatBoardId(bId))
                .name(label.getName())
                .color(label.getColor())
                .taskCount(label.getTasks() != null ? label.getTasks().size() : 0)
                .build();
    }
}
