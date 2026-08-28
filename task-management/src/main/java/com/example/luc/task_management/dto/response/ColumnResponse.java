package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.ColumnEntity;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColumnResponse {

    private Long id;
    private String formattedId;      // ví dụ: "C00001"
    private Long boardId;
    private String formattedBoardId; // ví dụ: "B00001"
    private String name;
    private Integer position;
    private int taskCount;
    private LocalDateTime createdAt;

    public static ColumnResponse fromEntity(ColumnEntity column) {
        Long bId = column.getBoard() != null ? column.getBoard().getId() : null;

        return ColumnResponse.builder()
                .id(column.getId())
                .formattedId(IdFormatter.formatColumnId(column.getId()))
                .boardId(bId)
                .formattedBoardId(IdFormatter.formatBoardId(bId))
                .name(column.getName())
                .position(column.getPosition())
                .taskCount(column.getTasks() != null ? column.getTasks().size() : 0)
                .createdAt(column.getCreatedAt())
                .build();
    }
}
