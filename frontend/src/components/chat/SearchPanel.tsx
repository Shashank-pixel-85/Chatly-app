import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import type { Message } from "@/types";
import { Spinner } from "@/components/common/States";
import { formatMessageTime } from "@/utils/format";

export function SearchPanel({
  chatId,
  onJumpTo,
  onClose,
}: {
  chatId: string;
  onJumpTo: (messageId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.messages
      .search(chatId, debounced.trim())
      .then(({ results }) => {
        if (!cancelled) setResults(results);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, chatId]);

  return (
    <div className="flex w-full max-w-sm flex-col border-l border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2 border-b border-ink-100 p-3 dark:border-ink-800">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this conversation"
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-accent-400 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
          />
        </div>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        )}
        {!loading && debounced && results.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-ink-400">No messages match “{debounced}”</p>
        )}
        {!loading &&
          results.map((m) => (
            <button
              key={m.id}
              onClick={() => onJumpTo(m.id)}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-ink-50 dark:hover:bg-ink-800"
            >
              <p className="line-clamp-2 text-sm text-ink-700 dark:text-ink-200">{m.text}</p>
              <p className="mt-0.5 text-xs text-ink-400">{formatMessageTime(m.createdAt)}</p>
            </button>
          ))}
      </div>
    </div>
  );
}
