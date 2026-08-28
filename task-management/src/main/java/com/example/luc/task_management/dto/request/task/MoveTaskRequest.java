package com.example.luc.task_management.dto.request.task;

import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.util.IdFormatter;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MoveTaskRequest {

    @NotNull(message = "Column can't be left blank")
    private Long columnId;

    @NotNull(message = "Status can't be left blank")
    private TaskStatus status;

    public void setColumnId(Object columnId) {
        if (columnId == null) {
            this.columnId = null;
        } else if (columnId instanceof Number num) {
            this.columnId = num.longValue();
        } else {
            this.columnId = IdFormatter.parseId(columnId.toString());
        }
    }
}
