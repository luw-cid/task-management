import axios, { AxiosError, type AxiosRequestConfig } from "axios";

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Missing refresh token");

        const response = await axios.post<{ token?: string; accessToken?: string; refreshToken?: string }>(
          "http://localhost:8080/auth/refresh",
          { refreshToken }
        );

        const nextToken = response.data.token ?? response.data.accessToken;
        if (!nextToken) throw new Error("Refresh response did not include an access token");

        localStorage.setItem("token", nextToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${nextToken}`,
        };

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("taskflow:auth-expired"));
        return Promise.reject(refreshError);
      }
    }

    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export default api;
