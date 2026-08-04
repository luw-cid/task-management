import { api, unwrapResponse } from "./axios";
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from "../types";

export const commentsApi = {
  getByTask(boardId: number, taskId: number, page = 0, size = 20) {
    return unwrapResponse<Comment[]>(
      api.get(`/boards/${boardId}/tasks/${taskId}/comments`, {
        params: { page, size },
      })
    );
  },

  create(boardId: number, taskId: number, payload: CreateCommentRequest) {
    return unwrapResponse<Comment>(api.post(`/boards/${boardId}/tasks/${taskId}/comments`, payload));
  },

  update(boardId: number, taskId: number, commentId: number | string, payload: UpdateCommentRequest) {
    return unwrapResponse<Comment>(
      api.put(`/boards/${boardId}/tasks/${taskId}/comments/${commentId}`, payload)
    );
  },

  delete(boardId: number, taskId: number, commentId: number | string) {
    return unwrapResponse(api.delete(`/boards/${boardId}/tasks/${taskId}/comments/${commentId}`));
  },
};
