import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { Avatar } from "@/components/common/Avatar";
import clsx from "clsx";

export function NewChatModal({ onClose, onOpenChat }: { onClose: () => void; onOpenChat: (chatId: string) => void }) {
  const users = useChatStore((s) => s.allUsers);
  const createDirectChat = useChatStore((s) => s.createDirectChat);
  const createGroupChat = useChatStore((s) => s.createGroupChat);
  const me = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);

  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleCreate() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      if (mode === "direct") {
        const chat = await createDirectChat(selected[0]);
        onOpenChat(chat.id);
      } else {
        if (!groupName.trim()) {
          pushToast("Give your group a name", "error");
          setBusy(false);
          return;
        }
        const chat = await createGroupChat(groupName.trim(), selected);
        onOpenChat(chat.id);
      }
      onClose();
    } catch {
      pushToast("Couldn't create the chat. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-pop-in rounded-2xl bg-white p-5 shadow-panel dark:bg-ink-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">New conversation</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex rounded-xl bg-ink-100 p-1 dark:bg-ink-800">
          {(["direct", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setSelected([]);
              }}
              className={clsx(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition",
                mode === m
                  ? "bg-white text-ink-900 shadow-sm dark:bg-ink-700 dark:text-white"
                  : "text-ink-500 dark:text-ink-400"
              )}
            >
              {m === "direct" ? "Direct message" : "Group chat"}
            </button>
          ))}
        </div>

        {mode === "group" && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="mb-3 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          />
        )}

        <div className="max-h-64 overflow-y-auto rounded-xl border border-ink-100 dark:border-ink-800">
          {users.map((u) => {
            const isSelected = selected.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => (mode === "direct" ? setSelected([u.id]) : toggle(u.id))}
                className={clsx(
                  "flex w-full items-center gap-3 border-b border-ink-100 px-3 py-2.5 text-left last:border-0 dark:border-ink-800",
                  isSelected && "bg-accent-500/10"
                )}
              >
                <Avatar name={u.name} color={u.avatarColor} size="sm" showStatus status={u.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{u.name}</p>
                  <p className="truncate text-xs text-ink-400">{u.email}</p>
                </div>
                <div
                  className={clsx(
                    "h-4 w-4 shrink-0 rounded-full border-2",
                    isSelected ? "border-accent-500 bg-accent-500" : "border-ink-300 dark:border-ink-600"
                  )}
                />
              </button>
            );
          })}
          {users.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-400">No other users yet</p>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={selected.length === 0 || busy}
          className="mt-4 w-full rounded-xl bg-accent-500 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
        >
          {busy ? "Creating…" : mode === "direct" ? "Start conversation" : `Create group (${selected.length})`}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-400">Signed in as {me?.name}</p>
      </div>
    </div>
  );
}
