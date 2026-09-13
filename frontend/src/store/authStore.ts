import { create } from "zustand";
import type { User } from "@/types";
import { api } from "@/lib/api";
import { socketService } from "@/lib/socket";

interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = "chatly_token";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  status: "idle",
  error: null,

  async login(email, password) {
    set({ status: "loading", error: null });
    try {
      const { token, user } = await api.auth.login(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, user, status: "authenticated" });
      socketService.connect(token);
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Login failed" });
      throw e;
    }
  },

  async register(name, email, password) {
    set({ status: "loading", error: null });
    try {
      const { token, user } = await api.auth.register(name, email, password);
      localStorage.setItem(TOKEN_KEY, token);
      set({ token, user, status: "authenticated" });
      socketService.connect(token);
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Registration failed" });
      throw e;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    socketService.disconnect();
    set({ user: null, token: null, status: "idle" });
  },

  async hydrate() {
    const token = get().token;
    if (!token) {
      set({ status: "idle" });
      return;
    }
    set({ status: "loading" });
    try {
      const { user } = await api.auth.me();
      set({ user, status: "authenticated" });
      socketService.connect(token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, status: "idle" });
    }
  },

  clearError() {
    set({ error: null });
  },
}));
