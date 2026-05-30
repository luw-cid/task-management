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

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

export function getAccessToken() {
  return isBrowser ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

export function getRefreshToken() {
  return isBrowser ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null) {
  if (!isBrowser) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  if (!isBrowser) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      notifyAuthExpired();
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
