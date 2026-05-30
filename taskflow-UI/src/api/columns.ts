import { api, unwrapResponse } from "./axios";
import type { Column, CreateColumnRequest, UpdateColumnRequest } from "../types";

export const columnsApi = {
  getByBoard(boardId: number) {
    return unwrapResponse<Column[]>(api.get(`/boards/${boardId}/columns`));
  },

  create(boardId: number, payload: CreateColumnRequest) {
    return unwrapResponse<Column>(api.post(`/boards/${boardId}/columns`, payload));
  },

  update(boardId: number, columnId: number, payload: UpdateColumnRequest) {
    return unwrapResponse<Column>(api.put(`/boards/${boardId}/columns/${columnId}`, payload));
  },

  delete(boardId: number, columnId: number) {
    return unwrapResponse(api.delete(`/boards/${boardId}/columns/${columnId}`));
  },
};
