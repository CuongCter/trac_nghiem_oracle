import type { Role } from "./constants";

/** Authenticated user */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  status?: "ACTIVE" | "LOCKED";
  createdAt?: string;
  updatedAt?: string;
}

/** Login response from /api/auth/login */
export interface LoginResponse {
  user: User;
  token: string;
}

/** Auth store state */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}
