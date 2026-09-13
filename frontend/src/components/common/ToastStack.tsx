import { useUiStore } from "@/store/uiStore";
import clsx from "clsx";

export function ToastStack() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={clsx(
            "pointer-events-auto animate-slide-up cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium shadow-panel",
            t.variant === "error" && "bg-coral-500 text-white",
            t.variant === "success" && "bg-emerald-500 text-white",
            t.variant === "info" && "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900"
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
