import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "../types";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_EXPIRED_EVENT = "taskflow:auth-expired";
const DEFAULT_API_URL = "http://localhost:8080/api";

const isBrowser = typeof window !== "undefined";

// Biến trong bộ nhớ để lưu giữ Access Token tạm thời (chống truy cập từ XSS)
let accessTokenInMemory: string | null = null;

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Cho phép tự động đính kèm và nhận HTTP-Only Cookie
});

export function getAccessToken() {
  return accessTokenInMemory;
}

export function setAccessToken(token: string | null) {
  accessTokenInMemory = token;
}

export function clearAuthTokens() {
  accessTokenInMemory = null;
}

function notifyAuthExpired() {
  clearAuthTokens();

  if (isBrowser) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      const url = originalRequest.url || "";
      
      // Không thực hiện silent refresh đối với các endpoint auth (login, register, refresh)
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")) {
        if (url.includes("/auth/refresh")) {
          notifyAuthExpired();
        }
        const message = error.response?.data?.message ?? error.message ?? "Authentication failed";
        return Promise.reject(new Error(message));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh");
        const newAccessToken = response.data.data.accessToken;

        setAccessToken(newAccessToken);
        isRefreshing = false;
        processQueue(null, newAccessToken);

        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        notifyAuthExpired();
        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export async function unwrapResponse<T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>
) {
  const response = await request;
  return response.data.data;
}

export type RequestConfig = AxiosRequestConfig;
