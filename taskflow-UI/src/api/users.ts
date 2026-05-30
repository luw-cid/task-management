import { api, unwrapResponse } from "./axios";
import type { ChangePasswordRequest, UpdateUserProfileRequest, UserProfile } from "../types";

export const usersApi = {
  getMe() {
    return unwrapResponse<UserProfile>(api.get("/users/me"));
  },

  updateMe(payload: UpdateUserProfileRequest) {
    return unwrapResponse<UserProfile>(api.put("/users/me", payload));
  },

  changePassword(payload: ChangePasswordRequest) {
    return unwrapResponse<void>(api.put("/users/me/change-password", payload));
  },

  removeAvatar() {
    return unwrapResponse<UserProfile>(api.delete("/users/me/avatar"));
  },
};
