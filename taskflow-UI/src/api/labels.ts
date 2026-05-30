import { api, unwrapResponse } from "./axios";
import type { CreateLabelRequest, Label, UpdateLabelRequest } from "../types";

export const labelsApi = {
  getByBoard(boardId: number) {
    return unwrapResponse<Label[]>(api.get(`/boards/${boardId}/labels`));
  },

  create(boardId: number, payload: CreateLabelRequest) {
    return unwrapResponse<Label>(api.post(`/boards/${boardId}/labels`, payload));
  },

  update(boardId: number, labelId: number, payload: UpdateLabelRequest) {
    return unwrapResponse<Label>(api.put(`/boards/${boardId}/labels/${labelId}`, payload));
  },

  delete(boardId: number, labelId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/labels/${labelId}`));
  },

  addToTask(boardId: number, taskId: number, labelId: number) {
    return unwrapResponse(api.post(`/boards/${boardId}/tasks/${taskId}/labels/${labelId}`));
  },

  removeFromTask(boardId: number, taskId: number, labelId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/task/${taskId}/labels/${labelId}`));
  },
};
