import type { MessageStatus } from "@/types";
import { Spinner } from "@/components/common/States";

export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  if (status === "sending") return <Spinner className="h-3 w-3 text-white/70" />;

  if (status === "failed") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-coral-200">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const doubleTick = status === "delivered" || status === "read";
  const colorClass = status === "read" ? "text-[#53bdeb]" : "text-[#5b7a63]";

  return (
    <svg width="16" height="13" viewBox="0 0 20 13" fill="none" className={colorClass}>
      <path d="M1 6.5 4.5 10 11 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {doubleTick && (
        <path
          d="M7 6.5 10.5 10 17 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
