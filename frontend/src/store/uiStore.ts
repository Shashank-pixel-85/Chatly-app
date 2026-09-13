import { create } from "zustand";

type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
  toasts: { id: string; message: string; variant: "info" | "error" | "success" }[];
  pushToast: (message: string, variant?: "info" | "error" | "success") => void;
  dismissToast: (id: string) => void;
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const stored = (localStorage.getItem("chatly_theme") as Theme | null) ??
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyThemeClass(stored);

export const useUiStore = create<UiState>((set, get) => ({
  theme: stored,
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("chatly_theme", next);
    applyThemeClass(next);
    set({ theme: next });
  },
  toasts: [],
  pushToast: (message, variant = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
