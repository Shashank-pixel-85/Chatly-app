import { useState } from "react";
import clsx from "clsx";
import type { Message, User } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { MessageStatusIcon } from "@/components/chat/MessageStatusIcon";
import { MessageActionBar } from "@/components/chat/MessageActionBar";
import { formatMessageTime, formatBytes } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useUiStore } from "@/store/uiStore";

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  sender?: User;
  replyToMessage?: Message | null;
  onReply: (message: Message) => void;
  onJumpTo?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  sender,
  replyToMessage,
  onReply,
  onJumpTo,
}: Props) {
  const me = useAuthStore((s) => s.user);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const reactMessage = useChatStore((s) => s.reactMessage);
  const retryMessage = useChatStore((s) => s.retryMessage);
  const pushToast = useUiStore((s) => s.pushToast);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  if (message.deleted) {
    return (
      <div className={clsx("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
        {!isOwn && <div className="w-8" />}
        <div className="max-w-[70%] rounded-2xl border border-dashed border-ink-200 px-4 py-2 text-sm italic text-ink-400 dark:border-ink-700">
          Message deleted
        </div>
      </div>
    );
  }

  async function submitEdit() {
    if (!draft.trim()) return;
    if (draft !== message.text) await editMessage(message.id, draft.trim());
    setEditing(false);
  }

  return (
    <div className={clsx("group flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar && sender && <Avatar name={sender.name} color={sender.avatarColor} size="sm" />}
        </div>
      )}

      <div className={clsx("relative max-w-[75%] sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
        <MessageActionBar
          isOwn={isOwn}
          onReply={() => onReply(message)}
          onReact={(emoji) => reactMessage(message.id, emoji)}
          onCopy={() => {
            navigator.clipboard.writeText(message.text);
            pushToast("Copied to clipboard", "success");
          }}
          onEdit={isOwn ? () => setEditing(true) : undefined}
          onDelete={isOwn ? () => deleteMessage(message.id) : undefined}
        />

        {showSenderName && !isOwn && sender && (
          <p className="mb-0.5 px-1 text-xs font-semibold text-accent-600 dark:text-accent-400">{sender.name}</p>
        )}

        <div
          className={clsx(
            "rounded-2xl px-3.5 py-2.5 shadow-sm",
            isOwn
              ? "rounded-br-md bg-[#d9fdd3] text-[#173b1a] dark:bg-[#1f5c35] dark:text-white"
              : "rounded-bl-md bg-white text-ink-800 dark:bg-ink-800 dark:text-ink-100"
          )}
        >
          {replyToMessage && (
            <button
              onClick={() => onJumpTo?.(replyToMessage.id)}
              className={clsx(
                "mb-1.5 block w-full rounded-lg border-l-2 px-2 py-1 text-left text-xs",
                isOwn ? "border-emerald-700/30 bg-emerald-900/5 text-emerald-950/80 dark:border-white/30 dark:bg-white/10 dark:text-white/90" : "border-accent-400 bg-ink-50 text-ink-500 dark:bg-ink-900 dark:text-ink-300"
              )}
            >
              <span className="block truncate">{replyToMessage.deleted ? "Message deleted" : replyToMessage.text || "Attachment"}</span>
            </button>
          )}

          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitEdit();
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-full resize-none rounded-lg bg-white/20 px-2 py-1 text-sm text-inherit outline-none placeholder:text-white/60"
                rows={2}
              />
              <div className="flex justify-end gap-2 text-xs">
                <button onClick={() => setEditing(false)} className="opacity-80 hover:opacity-100">
                  Cancel
                </button>
                <button onClick={submitEdit} className="font-semibold opacity-90 hover:opacity-100">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>}
              {message.attachments.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {message.attachments.map((a) => (
                    <AttachmentChip key={a.id} attachment={a} isOwn={isOwn} />
                  ))}
                </div>
              )}
            </>
          )}

          <div
            className={clsx(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              isOwn ? "text-emerald-900/60 dark:text-white/75" : "text-ink-400"
            )}
          >
            {message.edited && <span className="italic">edited</span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && <MessageStatusIcon status={message.status} />}
          </div>
        </div>

        {message.status === "failed" && (
          <button
            onClick={() => retryMessage(message.chatId, message.clientId!)}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-coral-500 hover:text-coral-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 14.6 2.5M19.5 9A8 8 0 0 0 4.9 6.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Failed to send · Tap to retry
          </button>
        )}

        {Object.keys(message.reactions).length > 0 && (
          <div className={clsx("mt-1 flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => reactMessage(message.id, emoji)}
                className={clsx(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                  userIds.includes(me?.id || "")
                    ? "border-accent-300 bg-accent-50 dark:border-accent-700 dark:bg-accent-900/30"
                    : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800"
                )}
              >
                <span>{emoji}</span>
                <span className="font-medium text-ink-500 dark:text-ink-300">{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentChip({ attachment, isOwn }: { attachment: Message["attachments"][number]; isOwn: boolean }) {
  const isImage = attachment.type.startsWith("image/");

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
        <img src={attachment.url} alt={attachment.name} className="max-h-56 w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        "flex items-center gap-2 rounded-lg px-2.5 py-2",
        isOwn ? "bg-white/15" : "bg-ink-50 dark:bg-ink-900"
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path
          d="M14 3v4a1 1 0 0 0 1 1h4M6 3h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{attachment.name}</p>
        <p className={clsx("text-[10px]", isOwn ? "text-white/70" : "text-ink-400")}>{formatBytes(attachment.size)}</p>
      </div>
    </a>
  );
}
