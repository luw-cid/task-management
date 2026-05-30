import { api, unwrapResponse } from "./axios";
import type { CreateSubtaskRequest, Subtask, UpdateSubtaskRequest } from "../types";

export const subtasksApi = {
  getByTask(boardId: number, taskId: number) {
    return unwrapResponse<Subtask[]>(api.get(`/boards/${boardId}/tasks/${taskId}/subtasks`));
  },

  create(boardId: number, taskId: number, payload: CreateSubtaskRequest) {
    return unwrapResponse<Subtask>(api.post(`/boards/${boardId}/tasks/${taskId}/subtasks`, payload));
  },

  update(boardId: number, taskId: number, subtaskId: number, payload: UpdateSubtaskRequest) {
    return unwrapResponse<Subtask>(
      api.put(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`, payload)
    );
  },

  delete(boardId: number, taskId: number, subtaskId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`));
  },
};
