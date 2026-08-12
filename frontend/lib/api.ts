import axios, { AxiosError } from "axios";
import { message } from "antd";
import { API_BASE_URL } from "./constants";
import { getToken, clearAuth } from "./storage";
import type { ApiError, ApiResponse } from "@/types/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unwrap the { success, data, message } envelope.
    const payload = response.data as ApiResponse<unknown>;
    if (payload && typeof payload === "object" && "success" in payload) {
      return payload.data as never;
    }
    return response.data;
  },
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    if (status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      message.error("Bạn không có quyền thực hiện thao tác này");
    } else if (status && status >= 500) {
      message.error("Lỗi máy chủ, vui lòng thử lại sau");
    } else if (error.code === "ECONNABORTED") {
      message.error("Yêu cầu quá thời gian, vui lòng thử lại");
    } else if (!error.response) {
      message.error("Không thể kết nối đến máy chủ");
    }

    const apiError: ApiError = {
      success: false,
      message:
        error.response?.data?.message ??
        error.message ??
        "Đã xảy ra lỗi không xác định",
      errors: error.response?.data?.errors,
      status,
    };
    return Promise.reject(apiError);
  },
);

export default api;
