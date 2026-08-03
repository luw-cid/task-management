package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.ColumnEntity;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColumnResponse {

    private Long id;
    private Long boardId;
    private String name;
    private Integer position;
    private int taskCount;
    private LocalDateTime createdAt;

    public static ColumnResponse fromEntity(ColumnEntity column) {
        return ColumnResponse.builder()
                .id(column.getId())
                .boardId(column.getBoard().getId())
                .name(column.getName())
                .position(column.getPosition())
                .taskCount(column.getTasks().size())
                .createdAt(column.getCreatedAt())
                .build();
    }
}
