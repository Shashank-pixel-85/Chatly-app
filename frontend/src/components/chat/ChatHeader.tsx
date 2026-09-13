import type { Chat, User } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { formatLastSeen } from "@/utils/format";

export function ChatHeader({
  chat,
  me,
  typingUsers,
  onToggleSearch,
  searchOpen,
  onBack,
}: {
  chat: Chat;
  me: User;
  typingUsers: User[];
  onToggleSearch: () => void;
  searchOpen: boolean;
  onBack?: () => void;
}) {
  const other = chat.type === "direct" ? chat.members.find((m) => m.id !== me.id) : null;
  const title = chat.type === "group" ? chat.name || "Group chat" : other?.name || "Unknown user";
  const avatarColor = chat.type === "group" ? "#4F5786" : other?.avatarColor || "#4F5786";

  const subtitle =
    typingUsers.length > 0
      ? `${typingUsers.map((u) => u.name.split(" ")[0]).join(", ")} typing…`
      : chat.type === "group"
      ? `${chat.members.length} members`
      : other?.status === "online"
      ? "Online"
      : other
      ? formatLastSeen(other.lastSeen)
      : "";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="mr-1 text-ink-400 hover:text-ink-700 md:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <Avatar name={title} color={avatarColor} showStatus={chat.type === "direct"} status={other?.status} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
          <p className="truncate text-xs text-ink-400">{subtitle}</p>
        </div>
      </div>

      <button
        onClick={onToggleSearch}
        title="Search in conversation"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          searchOpen
            ? "bg-accent-500 text-white"
            : "text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        }`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
