import { create } from "zustand";
import type { Attachment, Chat, Message, User, WsEvent } from "@/types";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface ChatState {
  chats: Chat[];
  chatsLoaded: boolean;
  messagesByChat: Record<string, Message[]>;
  cursorByChat: Record<string, string | null>;
  hasMoreByChat: Record<string, boolean>;
  loadingMessages: Record<string, boolean>;
  typingByChat: Record<string, string[]>; // userIds currently typing
  unreadByChat: Record<string, number>;
  activeChatId: string | null;
  allUsers: User[];

  loadChats: () => Promise<void>;
  loadUsers: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, attachments?: Attachment[], replyToId?: string | null) => Promise<void>;
  retryMessage: (chatId: string, clientId: string) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  reactMessage: (id: string, emoji: string) => Promise<void>;
  createDirectChat: (userId: string) => Promise<Chat>;
  createGroupChat: (name: string, memberIds: string[]) => Promise<Chat>;
  handleWsEvent: (event: WsEvent) => void;
  applyPresence: (userId: string, status: "online" | "offline", lastSeen: number) => void;
}

function upsertMessage(list: Message[], message: Message, clientId?: string) {
  const idx = list.findIndex((m) => m.id === message.id || (clientId && m.clientId === clientId));
  if (idx === -1) return [...list, message].sort((a, b) => a.createdAt - b.createdAt);
  const copy = [...list];
  copy[idx] = message;
  return copy;
}


const typingExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTypingUser(chatId: string, userId: string) {
  const key = `${chatId}:${userId}`;
  const timer = typingExpiryTimers.get(key);
  if (timer) clearTimeout(timer);
  typingExpiryTimers.delete(key);
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  chatsLoaded: false,
  messagesByChat: {},
  cursorByChat: {},
  hasMoreByChat: {},
  loadingMessages: {},
  typingByChat: {},
  unreadByChat: {},
  activeChatId: null,
  allUsers: [],

  async loadChats() {
    const { chats } = await api.chats.list();
    set({ chats, chatsLoaded: true });
  },

  async loadUsers() {
    const { users } = await api.users.list();
    set({ allUsers: users });
  },

  async selectChat(chatId) {
    set((s) => ({
      activeChatId: chatId,
      unreadByChat: { ...s.unreadByChat, [chatId]: 0 },
    }));
    if (!get().messagesByChat[chatId]) {
      set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: true } }));
      try {
        const page = await api.messages.list(chatId);
        set((s) => ({
          messagesByChat: { ...s.messagesByChat, [chatId]: [...page.messages].sort((a, b) => a.createdAt - b.createdAt) },
          cursorByChat: { ...s.cursorByChat, [chatId]: page.nextCursor },
          hasMoreByChat: { ...s.hasMoreByChat, [chatId]: page.hasMore },
        }));
      } finally {
        set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: false } }));
      }
    }
  },

  async loadMoreMessages(chatId) {
    if (get().loadingMessages[chatId] || !get().hasMoreByChat[chatId]) return;
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: true } }));
    try {
      const cursor = get().cursorByChat[chatId];
      const page = await api.messages.list(chatId, cursor);
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: [...page.messages, ...(s.messagesByChat[chatId] || [])].sort(
            (a, b) => a.createdAt - b.createdAt
          ),
        },
        cursorByChat: { ...s.cursorByChat, [chatId]: page.nextCursor },
        hasMoreByChat: { ...s.hasMoreByChat, [chatId]: page.hasMore },
      }));
    } finally {
      set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: false } }));
    }
  },

  async sendMessage(chatId, text, attachments = [], replyToId = null) {
    const me = useAuthStore.getState().user;
    if (!me) return;
    const clientId = crypto.randomUUID();
    const optimistic: Message = {
      id: clientId,
      chatId,
      senderId: me.id,
      text,
      attachments,
      replyToId,
      status: "sending",
      reactions: {},
      edited: false,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      clientId,
    };
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [...(s.messagesByChat[chatId] || []), optimistic],
      },
    }));

    try {
      const { message } = await api.messages.send(chatId, { text, attachments, replyToId, clientId });
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: upsertMessage(s.messagesByChat[chatId] || [], message, clientId),
        },
        chats: s.chats.map((c) => (c.id === chatId ? { ...c, lastMessage: message } : c)),
      }));
    } catch {
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: (s.messagesByChat[chatId] || []).map((m) =>
            m.clientId === clientId ? { ...m, status: "failed" } : m
          ),
        },
      }));
    }
  },

  async retryMessage(chatId, clientId) {
    const msg = (get().messagesByChat[chatId] || []).find((m) => m.clientId === clientId);
    if (!msg) return;
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] || []).map((m) =>
          m.clientId === clientId ? { ...m, status: "sending" } : m
        ),
      },
    }));
    try {
      const { message } = await api.messages.send(chatId, {
        text: msg.text,
        attachments: msg.attachments,
        replyToId: msg.replyToId,
        clientId,
      });
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: upsertMessage(s.messagesByChat[chatId] || [], message, clientId),
        },
      }));
    } catch {
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: (s.messagesByChat[chatId] || []).map((m) =>
            m.clientId === clientId ? { ...m, status: "failed" } : m
          ),
        },
      }));
    }
  },

  async editMessage(id, text) {
    const { message } = await api.messages.edit(id, text);
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [message.chatId]: upsertMessage(s.messagesByChat[message.chatId] || [], message),
      },
    }));
  },

  async deleteMessage(id) {
    const { message } = await api.messages.remove(id);
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [message.chatId]: upsertMessage(s.messagesByChat[message.chatId] || [], message),
      },
    }));
  },

  async reactMessage(id, emoji) {
    const { message } = await api.messages.react(id, emoji);
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [message.chatId]: upsertMessage(s.messagesByChat[message.chatId] || [], message),
      },
    }));
  },

  async createDirectChat(userId) {
    const { chat } = await api.chats.create({ type: "direct", memberIds: [userId] });
    set((s) => ({ chats: s.chats.some((c) => c.id === chat.id) ? s.chats : [chat, ...s.chats] }));
    return chat;
  },

  async createGroupChat(name, memberIds) {
    const { chat } = await api.chats.create({ type: "group", name, memberIds });
    set((s) => ({ chats: [chat, ...s.chats] }));
    return chat;
  },

  handleWsEvent(event) {
    switch (event.type) {
      case "message:new": {
        const { payload } = event;
        // A user's message is definitive proof that they are no longer typing.
        // Clear any stale typing state before rendering the new message.
        clearTypingUser(payload.chatId, payload.senderId);
        set((s) => {
          const isActive = s.activeChatId === payload.chatId;
          return {
            messagesByChat: {
              ...s.messagesByChat,
              [payload.chatId]: s.messagesByChat[payload.chatId]
                ? upsertMessage(s.messagesByChat[payload.chatId], payload)
                : s.messagesByChat[payload.chatId],
            },
            chats: s.chats.map((c) => (c.id === payload.chatId ? { ...c, lastMessage: payload } : c)),
            unreadByChat: isActive
              ? s.unreadByChat
              : { ...s.unreadByChat, [payload.chatId]: (s.unreadByChat[payload.chatId] || 0) + 1 },
            typingByChat: {
              ...s.typingByChat,
              [payload.chatId]: (s.typingByChat[payload.chatId] || []).filter((id) => id !== payload.senderId),
            },
          };
        });
        break;
      }
      case "message:update": {
        const { payload } = event;
        set((s) => ({
          messagesByChat: {
            ...s.messagesByChat,
            [payload.chatId]: s.messagesByChat[payload.chatId]
              ? upsertMessage(s.messagesByChat[payload.chatId], payload)
              : s.messagesByChat[payload.chatId],
          },
        }));
        break;
      }
      case "message:status": {
        const { payload } = event;
        set((s) => ({
          messagesByChat: {
            ...s.messagesByChat,
            [payload.chatId]: (s.messagesByChat[payload.chatId] || []).map((m) =>
              m.id === payload.messageId ? { ...m, status: payload.status } : m
            ),
          },
        }));
        break;
      }
      case "typing:start": {
        const { chatId, userId } = event.payload;
        clearTypingUser(chatId, userId);
        set((s) => ({
          typingByChat: {
            ...s.typingByChat,
            [chatId]: Array.from(new Set([...(s.typingByChat[chatId] || []), userId])),
          },
        }));
        // Safety expiry in case a stop event is lost. The normal path is the
        // explicit typing:stop sent by the composer after 3 seconds idle.
        typingExpiryTimers.set(`${chatId}:${userId}`, setTimeout(() => {
          set((s) => ({
            typingByChat: {
              ...s.typingByChat,
              [chatId]: (s.typingByChat[chatId] || []).filter((id) => id !== userId),
            },
          }));
          typingExpiryTimers.delete(`${chatId}:${userId}`);
        }, 5000));
        break;
      }
      case "typing:stop": {
        const { chatId, userId } = event.payload;
        clearTypingUser(chatId, userId);
        set((s) => ({
          typingByChat: {
            ...s.typingByChat,
            [chatId]: (s.typingByChat[chatId] || []).filter((id) => id !== userId),
          },
        }));
        break;
      }
      case "presence:update": {
        get().applyPresence(event.payload.userId, event.payload.status, event.payload.lastSeen);
        break;
      }
      case "chat:new": {
        set((s) => ({ chats: s.chats.some((c) => c.id === event.payload.id) ? s.chats : [event.payload, ...s.chats] }));
        break;
      }
    }
  },

  applyPresence(userId, status, lastSeen) {
    set((s) => ({
      chats: s.chats.map((c) => ({
        ...c,
        members: c.members.map((m) => (m.id === userId ? { ...m, status, lastSeen } : m)),
      })),
      allUsers: s.allUsers.map((u) => (u.id === userId ? { ...u, status, lastSeen } : u)),
    }));
  },
}));
