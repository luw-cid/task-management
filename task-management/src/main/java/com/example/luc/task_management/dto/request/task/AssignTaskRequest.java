package com.example.luc.task_management.dto.request.task;

import com.example.luc.task_management.util.IdFormatter;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AssignTaskRequest {
    private Long assigneeId;

    public void setAssigneeId(Object assigneeId) {
        if (assigneeId == null) {
            this.assigneeId = null;
        } else if (assigneeId instanceof Number num) {
            this.assigneeId = num.longValue();
        } else {
            this.assigneeId = IdFormatter.parseId(assigneeId.toString());
        }
    }
}
