import { api, unwrapResponse } from "./axios";
import type { ChatMessage, SendChatMessageRequest } from "../types";

export const chatApi = {
  // ─── TASK CHAT ───
  sendMessage: (boardId: number, taskId: number, request: SendChatMessageRequest): Promise<ChatMessage> =>
    unwrapResponse(api.post<any>(`/boards/${boardId}/tasks/${taskId}/chat/messages`, request)),

  getMessages: (boardId: number, taskId: number, page = 0, size = 50): Promise<ChatMessage[]> =>
    unwrapResponse(
      api.get<any>(`/boards/${boardId}/tasks/${taskId}/chat/messages`, {
        params: { page, size },
      })
    ),

  searchMessages: (boardId: number, taskId: number, keyword: string, page = 0, size = 50): Promise<ChatMessage[]> =>
    unwrapResponse(
      api.get<any>(`/boards/${boardId}/tasks/${taskId}/chat/messages/search`, {
        params: { keyword, page, size },
      })
    ),

  deleteMessage: (boardId: number, taskId: number, messageId: string): Promise<void> =>
    unwrapResponse(api.delete<any>(`/boards/${boardId}/tasks/${taskId}/chat/messages/${messageId}`)),

  joinChat: (boardId: number, taskId: number): Promise<void> =>
    unwrapResponse(api.post<any>(`/boards/${boardId}/tasks/${taskId}/chat/join`)),

  countMessages: (boardId: number, taskId: number): Promise<{ count: number }> =>
    unwrapResponse(
      api.get<{ count: number }>(`/boards/${boardId}/tasks/${taskId}/chat/count`)
    ),

  // ─── BOARD CHAT ───
  sendBoardMessage: (boardId: number, request: SendChatMessageRequest): Promise<ChatMessage> =>
    unwrapResponse(api.post<any>(`/boards/${boardId}/chat/messages`, request)),

  getBoardMessages: (boardId: number, page = 0, size = 50): Promise<ChatMessage[]> =>
    unwrapResponse(
      api.get<any>(`/boards/${boardId}/chat/messages`, {
        params: { page, size },
      })
    ),

  searchBoardMessages: (boardId: number, keyword: string, page = 0, size = 50): Promise<ChatMessage[]> =>
    unwrapResponse(
      api.get<any>(`/boards/${boardId}/chat/messages/search`, {
        params: { keyword, page, size },
      })
    ),

  deleteBoardMessage: (boardId: number, messageId: string): Promise<void> =>
    unwrapResponse(api.delete<any>(`/boards/${boardId}/chat/messages/${messageId}`)),

  joinBoardChat: (boardId: number): Promise<void> =>
    unwrapResponse(api.post<any>(`/boards/${boardId}/chat/join`)),

  countBoardMessages: (boardId: number): Promise<{ count: number }> =>
    unwrapResponse(api.get<{ count: number }>(`/boards/${boardId}/chat/count`)),
};
