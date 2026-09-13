import type { ReactNode } from "react";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-accent-500 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      {icon && <div className="text-ink-300 dark:text-ink-600">{icon}</div>}
      <p className="font-semibold text-ink-700 dark:text-ink-100">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-400 dark:text-ink-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="rounded-full bg-coral-500/10 p-3 text-coral-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-600 dark:text-ink-200">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-ink-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-ink-800 dark:bg-accent-500 dark:hover:bg-accent-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}
