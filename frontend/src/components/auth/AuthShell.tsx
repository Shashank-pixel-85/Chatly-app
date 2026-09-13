import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-coral-500/20 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 font-bold">C</div>
          <span className="text-lg font-bold">Chatly</span>
        </div>
        <div className="relative">
          <p className="text-3xl font-bold leading-snug">
            Every message,
            <br />
            delivered in real time.
          </p>
          <p className="mt-4 max-w-sm text-sm text-ink-300">
            Typing indicators, read receipts, and instant delivery — built for teams who move fast
            together.
          </p>
        </div>
        <p className="relative text-xs text-ink-400">Real-Time Chat Application · Demo build</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 font-bold text-white">
              P
            </div>
            <span className="text-lg font-bold text-ink-900 dark:text-white">Chatly</span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
