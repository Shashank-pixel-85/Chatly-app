import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useWebSocketBridge } from "@/hooks/useWebSocketBridge";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { EmptyState, ErrorState, Spinner } from "@/components/common/States";
import clsx from "clsx";

export default function ChatPage() {
  const chats = useChatStore((s) => s.chats);
  const chatsLoaded = useChatStore((s) => s.chatsLoaded);
  const loadChats = useChatStore((s) => s.loadChats);
  const loadUsers = useChatStore((s) => s.loadUsers);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [initError, setInitError] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const connectionState = useWebSocketBridge();

  useEffect(() => {
    setInitError(false);
    Promise.all([loadChats(), loadUsers()]).catch(() => setInitError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  function handleSelectChat(id: string) {
    setActiveChatId(id);
    setShowListOnMobile(false);
  }

  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <ErrorState
          message="Couldn't load your conversations."
          onRetry={() => {
            setInitError(false);
            Promise.all([loadChats(), loadUsers()]).catch(() => setInitError(true));
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50 dark:bg-ink-950">
      <div className={clsx("h-full", showListOnMobile ? "flex w-full md:flex" : "hidden md:flex")}>
        <Sidebar activeChatId={activeChatId} onSelectChat={handleSelectChat} connectionState={connectionState} />
      </div>

      <div className={clsx("h-full min-w-0 flex-1", showListOnMobile ? "hidden md:flex" : "flex")}>
        {!chatsLoaded ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : activeChat ? (
          <ChatWindow chat={activeChat} onBack={() => setShowListOnMobile(true)} />
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-ink-50 dark:bg-ink-950">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-coral-500/10 blur-3xl" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 py-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500 text-2xl font-extrabold text-white shadow-lg shadow-accent-500/20">C</div>
              <p className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
                Welcome to Chatly
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-ink-500 dark:text-ink-400 sm:text-base">
                Stay connected with your team through fast, real-time conversations, reactions, typing indicators, and read receipts.
              </p>
              <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["⚡", "Real-time", "Messages arrive instantly"],
                  ["💬", "Team chats", "Direct and group conversations"],
                  ["✓✓", "Stay in sync", "Delivery and read status"],
                ].map(([icon, title, text]) => (
                  <div key={title} className="rounded-2xl border border-ink-200/70 bg-white/80 p-4 text-left shadow-sm backdrop-blur dark:border-ink-800 dark:bg-ink-900/70">
                    <div className="text-xl">{icon}</div>
                    <p className="mt-2 text-sm font-bold text-ink-800 dark:text-ink-100">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-400">{text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-xs font-medium text-ink-400">Select a conversation from the sidebar to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
