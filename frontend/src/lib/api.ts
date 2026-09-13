import type { Attachment, Chat, Message, User } from "@/types";

const BASE = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem("chatly_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || "Request failed", res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<{ user: User }>("/auth/me"),
  },
  users: {
    list: () => request<{ users: User[] }>("/users"),
  },
  chats: {
    list: () => request<{ chats: Chat[] }>("/chats"),
    create: (payload: { type: "direct" | "group"; name?: string; memberIds: string[] }) =>
      request<{ chat: Chat }>("/chats", { method: "POST", body: JSON.stringify(payload) }),
  },
  messages: {
    list: (chatId: string, cursor?: string | null, limit = 25) =>
      request<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }>(
        `/chats/${chatId}/messages?${new URLSearchParams({
          ...(cursor ? { cursor } : {}),
          limit: String(limit),
        })}`
      ),
    search: (chatId: string, q: string) =>
      request<{ results: Message[] }>(`/chats/${chatId}/search?q=${encodeURIComponent(q)}`),
    send: (
      chatId: string,
      payload: { text: string; attachments?: Attachment[]; replyToId?: string | null; clientId: string }
    ) =>
      request<{ message: Message }>(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    edit: (id: string, text: string) =>
      request<{ message: Message }>(`/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ text }),
      }),
    remove: (id: string) => request<{ message: Message }>(`/messages/${id}`, { method: "DELETE" }),
    react: (id: string, emoji: string) =>
      request<{ message: Message }>(`/messages/${id}/react`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      }),
    markRead: (id: string) => request<{ message: Message }>(`/messages/${id}/read`, { method: "POST" }),
  },
  upload: {
    file: (file: File, onProgress: (pct: number) => void) =>
      new Promise<{ attachment: Attachment }>((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE}/upload`);
        const token = getToken();
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new ApiError("Upload failed", xhr.status));
          }
        };
        xhr.onerror = () => reject(new ApiError("Upload failed", 0));
        xhr.send(form);
      }),
  },
};

export { ApiError, getToken };
