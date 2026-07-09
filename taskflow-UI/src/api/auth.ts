import { api, clearAuthTokens, setAccessToken, unwrapResponse } from "./axios";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";

interface ApiUserInfo {
  id: number;
  email: string;
  fullname: string;
  avatarUrl: string | null;
  role: string;
}

interface ApiAuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  user: ApiUserInfo;
}

function normalizeAuthResponse(response: ApiAuthResponse): AuthResponse {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken || "",
    tokenType: response.tokenType,
    user: {
      id: response.user.id,
      email: response.user.email,
      fullName: response.user.fullname,
      avatarUrl: response.user.avatarUrl,
      role: response.user.role,
    },
  };
}

async function persistAuthResponse(request: ReturnType<typeof api.post>) {
  const response = normalizeAuthResponse(await unwrapResponse<ApiAuthResponse>(request));
  setAccessToken(response.accessToken);
  return response;
}

export const authApi = {
  login(payload: LoginRequest) {
    return persistAuthResponse(api.post("/auth/login", payload));
  },

  register(payload: RegisterRequest) {
    return persistAuthResponse(
      api.post("/auth/register", {
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName,
      })
    );
  },

  async logout() {
    try {
      await unwrapResponse(api.post("/auth/logout"));
    } finally {
      clearAuthTokens();
    }
  },
};
