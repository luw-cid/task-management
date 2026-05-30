import { api, unwrapResponse } from "./axios";
import type {
  AssignTaskRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  Task,
  UpdateTaskRequest,
} from "../types";

export const tasksApi = {
  getByBoard(boardId: number, sortBy = "createdAt") {
    return unwrapResponse<Task[]>(
      api.get(`/boards/${boardId}/tasks`, {
        params: { sortBy },
      })
    );
  },

  getByColumn(boardId: number, columnId: number) {
    return unwrapResponse<Task[]>(api.get(`/boards/${boardId}/tasks/column/${columnId}`));
  },

  getById(boardId: number, taskId: number) {
    return unwrapResponse<Task>(api.get(`/boards/${boardId}/tasks/${taskId}`));
  },

  create(boardId: number, payload: CreateTaskRequest) {
    return unwrapResponse<Task>(api.post(`/boards/${boardId}/tasks`, payload));
  },

  update(boardId: number, taskId: number, payload: UpdateTaskRequest) {
    return unwrapResponse<Task>(api.put(`/boards/${boardId}/tasks/${taskId}`, payload));
  },

  move(boardId: number, taskId: number, payload: MoveTaskRequest) {
    return unwrapResponse<Task>(api.put(`/boards/${boardId}/tasks/${taskId}/move`, payload));
  },

  assign(boardId: number, taskId: number, payload: AssignTaskRequest) {
    return unwrapResponse<Task>(api.put(`/boards/${boardId}/tasks/${taskId}/assign`, payload));
  },

  delete(boardId: number, taskId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/tasks/${taskId}`));
  },
};
