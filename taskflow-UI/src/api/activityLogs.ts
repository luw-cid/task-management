import { api, unwrapResponse } from "./axios";
import type { ActivityLog } from "../types";

export const activityLogsApi = {
  getByBoard(boardId: number, page = 0, size = 20) {
    return unwrapResponse<ActivityLog[]>(
      api.get(`/boards/${boardId}/activity`, {
        params: { page, size },
      })
    );
  },

  getByTask(boardId: number, taskId: number) {
    return unwrapResponse<ActivityLog[]>(api.get(`/boards/${boardId}/tasks/${taskId}/activity`));
  },
};
