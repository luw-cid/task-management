import { api, unwrapResponse } from "./axios";
import type { Notification } from "../types";

export const notificationsApi = {
  getAll(page = 0, size = 20) {
    return unwrapResponse<Notification[]>(
      api.get("/notifications", {
        params: { page, size },
      })
    );
  },

  async getUnreadCount() {
    const data = await unwrapResponse<{ unreadCount: number }>(api.get("/notifications/unread-count"));
    return data.unreadCount;
  },

  markAsRead(notificationId: number) {
    return unwrapResponse(api.put(`/notifications/${notificationId}/read`));
  },

  markAllAsRead() {
    return unwrapResponse(api.put("/notifications/read-all"));
  },

  delete(notificationId: number) {
    return unwrapResponse(api.delete(`/notifications/${notificationId}`));
  },
};
