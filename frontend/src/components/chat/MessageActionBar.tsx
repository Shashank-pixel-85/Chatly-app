import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageActionBar({
  isOwn,
  onReply,
  onReact,
  onCopy,
  onEdit,
  onDelete,
}: {
  isOwn: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showPicker) return;

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setShowPicker(false);
        setHovered(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showPicker]);

  return (
    <div
      onMouseEnter={() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setHovered(true);
      }}
      onMouseLeave={() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        // Give the pointer a short grace period to travel from the toolbar
        // into the picker without making the controls disappear.
        hideTimerRef.current = setTimeout(() => {
          if (!showPicker) setHovered(false);
        }, 180);
      }}
      className={clsx(
        "absolute top-0 z-40 flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-ink-100 bg-white p-1 shadow-panel transition-opacity dark:border-ink-700 dark:bg-ink-800",
        showPicker || hovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        isOwn ? "right-2" : "left-2"
      )}
    >
      <div className="relative">
        <ActionButton label="React" onClick={() => {
            setShowPicker((v) => {
              const next = !v;
              if (next) setHovered(true);
              return next;
            });
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.5 14s1.2 2 3.5 2 3.5-2 3.5-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.5 9.5h.01M15.5 9.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </ActionButton>
        {showPicker && (
          <div
            ref={pickerRef}
            className={clsx(
              "absolute top-9 z-20 flex gap-0.5 rounded-full border border-ink-100 bg-white p-1 shadow-panel dark:border-ink-700 dark:bg-ink-800",
              isOwn ? "right-0" : "left-0"
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(emoji);
                  setShowPicker(false);
                  setHovered(false);
                }}
                className="rounded-full p-1.5 text-base transition hover:scale-125 hover:bg-ink-100 dark:hover:bg-ink-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <ActionButton label="Reply" onClick={onReply}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M9 10 4 15l5 5M4 15h10a6 6 0 0 0 6-6V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ActionButton>

      <ActionButton label="Copy" onClick={onCopy}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 16V5a1 1 0 0 1 1-1h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </ActionButton>

      {isOwn && onEdit && (
        <ActionButton label="Edit" onClick={onEdit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ActionButton>
      )}

      {isOwn && onDelete && (
        <ActionButton label="Delete" onClick={onDelete} danger>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ActionButton>
      )}
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700",
        danger && "hover:text-coral-500"
      )}
    >
      {children}
    </button>
  );
}
