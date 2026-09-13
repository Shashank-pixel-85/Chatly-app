import { useEffect, useRef, useState } from "react";
import type { Message, PendingAttachment } from "@/types";
import { api } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { useUiStore } from "@/store/uiStore";
import { formatBytes } from "@/utils/format";

export function MessageComposer({
  chatId,
  replyTo,
  onCancelReply,
  onSend,
}: {
  chatId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
  onSend: (text: string, attachments: PendingAttachment["uploaded"][], replyToId: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    setText("");
    setPendingFiles([]);
    onCancelReply();

    return () => {
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      typingStopRef.current = null;
      if (isTypingRef.current) {
        socketService.setTyping(chatId, false);
        isTypingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  function stopTyping() {
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = null;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.send("typing:stop", { chatId });
    }
  }

  function notifyTyping(active: boolean) {
    if (!active) {
      stopTyping();
      return;
    }

    // Only announce the transition into typing once. Every keystroke merely
    // resets the 3-second idle timer so the remote indicator stays visible
    // while the user continues typing.
    if (!isTypingRef.current) {
      socketService.send("typing:start", { chatId });
      isTypingRef.current = true;
    }

    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(stopTyping, 3000);
  }

  function handleChange(value: string) {
    setText(value);
    notifyTyping(Boolean(value.trim()));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const items: PendingAttachment[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...items]);

    items.forEach(async (item) => {
      try {
        const { attachment } = await api.upload.file(item.file, (pct) => {
          setPendingFiles((prev) => prev.map((p) => (p.id === item.id ? { ...p, progress: pct } : p)));
        });
        setPendingFiles((prev) => prev.map((p) => (p.id === item.id ? { ...p, uploaded: attachment, progress: 100 } : p)));
      } catch {
        setPendingFiles((prev) => prev.map((p) => (p.id === item.id ? { ...p, error: "Upload failed" } : p)));
        pushToast(`Couldn't upload ${item.file.name}`, "error");
      }
    });
  }

  function removeAttachment(id: string) {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSubmit() {
    const trimmed = text.trim();
    const uploaded = pendingFiles.filter((p) => p.uploaded).map((p) => p.uploaded!);
    const stillUploading = pendingFiles.some((p) => !p.uploaded && !p.error);
    if (stillUploading) {
      pushToast("Wait for attachments to finish uploading", "info");
      return;
    }
    if (!trimmed && uploaded.length === 0) return;

    // Stop typing BEFORE sending the message so the remote indicator cannot
    // outlive the message by the duration of the REST request.
    notifyTyping(false);
    onSend(trimmed, uploaded, replyTo?.id || null);
    setText("");
    setPendingFiles([]);
  }

  return (
    <div className="border-t border-ink-100 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-2 border-accent-400 bg-ink-50 px-3 py-1.5 dark:bg-ink-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-accent-600 dark:text-accent-400">Replying to message</p>
            <p className="truncate text-xs text-ink-500 dark:text-ink-400">{replyTo.text || "Attachment"}</p>
          </div>
          <button onClick={onCancelReply} className="shrink-0 px-2 text-ink-400 hover:text-ink-600">
            ✕
          </button>
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingFiles.map((p) => (
            <div
              key={p.id}
              className="relative flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 dark:border-ink-700 dark:bg-ink-800"
            >
              {p.previewUrl ? (
                <img src={p.previewUrl} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-ink-200 text-ink-500 dark:bg-ink-700">
                  📄
                </div>
              )}
              <div className="min-w-0">
                <p className="max-w-[120px] truncate text-xs font-medium text-ink-700 dark:text-ink-200">{p.file.name}</p>
                <p className="text-[10px] text-ink-400">
                  {p.error ? "Failed" : p.progress < 100 ? `${p.progress}%` : formatBytes(p.file.size)}
                </p>
                {!p.uploaded && !p.error && (
                  <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-600">
                    <div className="h-full bg-accent-500 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => removeAttachment(p.id)}
                className="ml-1 text-ink-400 hover:text-coral-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.19 5.19L9.66 17.65a1.83 1.83 0 0 1-2.6-2.6l8.49-8.48"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          onBlur={() => {
            if (isTypingRef.current) {
              if (typingStopRef.current) clearTimeout(typingStopRef.current);
              typingStopRef.current = setTimeout(stopTyping, 3000);
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-40 flex-1 resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm outline-none transition focus:border-accent-400 focus:bg-white focus:ring-2 focus:ring-accent-100 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:bg-ink-900"
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim() && pendingFiles.every((p) => !p.uploaded)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition hover:bg-accent-600 disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="m3 11 18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
