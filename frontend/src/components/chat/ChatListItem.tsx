import clsx from "clsx";
import type { Chat, User } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { formatMessageTime } from "@/utils/format";

interface Props {
  chat: Chat;
  me: User;
  active: boolean;
  unreadCount: number;
  isTyping: boolean;
  onSelect: () => void;
}

export function ChatListItem({ chat, me, active, unreadCount, isTyping, onSelect }: Props) {
  const other = chat.type === "direct" ? chat.members.find((m) => m.id !== me.id) : null;
  const title = chat.type === "group" ? chat.name || "Group chat" : other?.name || "Unknown user";
  const avatarName = title;
  const avatarColor = chat.type === "group" ? "#4F5786" : other?.avatarColor || "#4F5786";
  const status = other?.status;

  const preview = isTyping
    ? "typing…"
    : chat.lastMessage?.deleted
    ? "Message deleted"
    : chat.lastMessage
    ? `${chat.lastMessage.senderId === me.id ? "You: " : ""}${
        chat.lastMessage.text || (chat.lastMessage.attachments.length ? "📎 Attachment" : "")
      }`
    : "No messages yet";

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
        active ? "bg-accent-500/10 dark:bg-accent-500/15" : "hover:bg-ink-100 dark:hover:bg-ink-800/60"
      )}
    >
      <Avatar name={avatarName} color={avatarColor} showStatus={chat.type === "direct"} status={status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={clsx("truncate text-sm font-semibold", active ? "text-accent-700 dark:text-accent-300" : "text-ink-800 dark:text-ink-100")}>
            {title}
          </p>
          {chat.lastMessage && (
            <span className="shrink-0 text-[11px] text-ink-400 dark:text-ink-500">
              {formatMessageTime(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={clsx(
              "truncate text-xs",
              isTyping ? "font-medium text-accent-500" : "text-ink-400 dark:text-ink-500"
            )}
          >
            {preview}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
