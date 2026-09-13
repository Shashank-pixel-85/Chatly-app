import { useMemo, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { Avatar } from "@/components/common/Avatar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { EmptyState } from "@/components/common/States";
import type { ConnectionState } from "@/types";
import clsx from "clsx";

export function Sidebar({
  activeChatId,
  onSelectChat,
  connectionState,
}: {
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  connectionState: ConnectionState;
}) {
  const chats = useChatStore((s) => s.chats);
  const chatsLoaded = useChatStore((s) => s.chatsLoaded);
  const unreadByChat = useChatStore((s) => s.unreadByChat);
  const typingByChat = useChatStore((s) => s.typingByChat);
  const me = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.toLowerCase();
    return chats.filter((c) => {
      const title = c.type === "group" ? c.name || "" : c.members.find((m) => m.id !== me?.id)?.name || "";
      return title.toLowerCase().includes(q);
    });
  }, [chats, query, me]);

  if (!me) return null;

  return (
    <aside className="flex h-full w-full flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900 md:w-80 lg:w-96">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white">
            C
          </div>
          <span className="text-base font-bold text-ink-900 dark:text-white">Chatly</span>
          <ConnectionBadge state={connectionState} />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setShowModal(true)}
            title="New conversation"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent-400 focus:bg-white focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:bg-ink-900"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {!chatsLoaded ? (
          <div className="space-y-2 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-1 py-2.5">
                <div className="h-10 w-10 animate-pulse rounded-full bg-ink-100 dark:bg-ink-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? "No chats found" : "No conversations yet"}
            description={query ? "Try a different name." : "Start a new conversation to say hello."}
          />
        ) : (
          <div className="space-y-1">
            {filtered.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                me={me}
                active={chat.id === activeChatId}
                unreadCount={unreadByChat[chat.id] || 0}
                isTyping={(typingByChat[chat.id] || []).some((id) => id !== me.id)}
                onSelect={() => onSelectChat(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-3 dark:border-ink-800">
        <Avatar name={me.name} color={me.avatarColor} showStatus status="online" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{me.name}</p>
          <p className="truncate text-xs text-ink-400">{me.email}</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-coral-500 dark:hover:bg-ink-800"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {showModal && <NewChatModal onClose={() => setShowModal(false)} onOpenChat={onSelectChat} />}
    </aside>
  );
}

function ConnectionBadge({ state }: { state: ConnectionState }) {
  if (state === "open") return null;
  const label = state === "connecting" ? "Connecting…" : state === "reconnecting" ? "Reconnecting…" : "Offline";
  return (
    <span
      className={clsx(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
      )}
    >
      {label}
    </span>
  );
}
