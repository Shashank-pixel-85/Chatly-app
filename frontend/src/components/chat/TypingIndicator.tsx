import { Avatar } from "@/components/common/Avatar";
import type { User } from "@/types";

export function TypingIndicator({ users }: { users: User[] }) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0].name} is typing`
      : users.length === 2
      ? `${users[0].name} and ${users[1].name} are typing`
      : `${users.length} people are typing`;

  return (
    <div className="flex items-end gap-2 px-1" aria-label={label}>
      <div className="w-8 shrink-0">
        <Avatar name={users[0].name} color={users[0].avatarColor} size="sm" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm dark:bg-ink-800">
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-blink rounded-full bg-ink-400 dark:bg-ink-500"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
