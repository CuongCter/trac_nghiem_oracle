import { api } from "./api";
import type { LoginResponse, User } from "@/types/user";

export async function loginRequest(email: string, password: string) {
  return api.post<LoginResponse>("/auth/login", { email, password });
}

export async function registerRequest(payload: {
  fullName: string;
  email: string;
  password: string;
  role?: "STUDENT" | "TEACHER" | "ADMIN";
}) {
  return api.post<LoginResponse>("/auth/register", payload);
}

export async function meRequest() {
  return api.get<{ user: User }>("/auth/me");
}

export async function logoutRequest() {
  try {
    await api.post("/auth/logout");
  } catch {
    /* ignore */
  }
}
