import { useEffect, useMemo, useRef, useState } from "react";
import type { Chat, Message, PendingAttachment, User } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SearchPanel } from "@/components/chat/SearchPanel";
import { Spinner, EmptyState, ErrorState } from "@/components/common/States";
import { useInfiniteScrollTop } from "@/hooks/useInfiniteScrollTop";
import { formatDayLabel, sameDay } from "@/utils/format";
import { api } from "@/lib/api";
import { socketService } from "@/lib/socket";

export function ChatWindow({ chat, onBack }: { chat: Chat; onBack?: () => void }) {
  const me = useAuthStore((s) => s.user)!;
  const messagesByChat = useChatStore((s) => s.messagesByChat);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const hasMoreByChat = useChatStore((s) => s.hasMoreByChat);
  const typingByChat = useChatStore((s) => s.typingByChat);
  const allUsers = useChatStore((s) => s.allUsers);
  const selectChat = useChatStore((s) => s.selectChat);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const messages = messagesByChat[chat.id] || [];
  const loading = loadingMessages[chat.id];
  const hasMore = hasMoreByChat[chat.id];

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    setLoadError(false);
    initialLoadDone.current = false;
    selectChat(chat.id).catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  useEffect(() => {
    if (!loading && !initialLoadDone.current && messages.length >= 0) {
      initialLoadDone.current = true;
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }));
    }
  }, [loading, messages.length]);

  const lastMessageIdRef = useRef<string | null>(null);
  const markedReadIdsRef = useRef<Set<string>>(new Set());

  function markIncomingAsRead() {
    const el = scrollRef.current;
    const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 240 : true;
    if (!nearBottom || messages.length === 0) return;

    messages
      .filter((message) => message.senderId !== me.id && message.status !== "read" && !markedReadIdsRef.current.has(message.id))
      .forEach((message) => {
        markedReadIdsRef.current.add(message.id);
        api.messages.markRead(message.id).catch(() => markedReadIdsRef.current.delete(message.id));
      });
  }

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;

    const el = scrollRef.current;
    const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 200 : true;
    if (last.senderId === me.id || nearBottom) {
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: last.senderId === me.id ? "smooth" : "auto" }));
    }
  }, [messages, me.id]);

  // Mark incoming messages as read once the conversation is open and the
  // user is at/near the latest messages. This runs after message loading and
  // whenever realtime messages arrive, and the scroll handler below covers
  // the case where the user reaches the bottom later.
  useEffect(() => {
    const frame = requestAnimationFrame(markIncomingAsRead);
    return () => cancelAnimationFrame(frame);
    // messages intentionally drives this effect; markIncomingAsRead reads the latest array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, me.id, chat.id]);

  useInfiniteScrollTop(scrollRef, () => loadMoreMessages(chat.id), {
    enabled: !!hasMore,
    loading: !!loading,
  });

  const typingUsers = useMemo(() => {
    const ids = Array.from(new Set(typingByChat[chat.id] || [])).filter((id) => id !== me.id);
    return ids
      .map((id) => chat.members.find((m) => m.id === id) || allUsers.find((m) => m.id === id))
      .filter(Boolean) as User[];
  }, [typingByChat, chat.id, chat.members, allUsers, me.id]);

  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const memberMap = useMemo(() => new Map(chat.members.map((m) => [m.id, m])), [chat.members]);

  function handleJumpTo(messageId: string) {
    setSearchOpen(false);
    setHighlightId(messageId);
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightId(null), 1600);
  }

  function handleSend(text: string, attachments: PendingAttachment["uploaded"][], replyToId: string | null) {
    sendMessage(
      chat.id,
      text,
      attachments.filter((a): a is NonNullable<typeof a> => !!a),
      replyToId
    );
    setReplyTo(null);
  }

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <ChatHeader
          chat={chat}
          me={me}
          typingUsers={typingUsers}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          searchOpen={searchOpen}
          onBack={onBack}
        />

        <div
          ref={scrollRef}
          onScroll={markIncomingAsRead}
          className="flex-1 overflow-y-auto bg-ink-50 px-3 py-4 dark:bg-ink-950 sm:px-6"
        >
          {loadError ? (
            <ErrorState message="Couldn't load this conversation." onRetry={() => selectChat(chat.id)} />
          ) : loading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Send the first message to get the conversation going."
            />
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
              {hasMore && (
                <div className="flex justify-center py-2">
                  {loading ? <Spinner className="h-4 w-4" /> : <span className="text-xs text-ink-400">Scroll up for more</span>}
                </div>
              )}
              {messages.map((message, idx) => {
                const prev = messages[idx - 1];
                const next = messages[idx + 1];
                const showDivider = !prev || !sameDay(prev.createdAt, message.createdAt);
                const isOwn = message.senderId === me.id;
                const sameSenderAsPrev = prev && prev.senderId === message.senderId && !showDivider;
                const sameSenderAsNext = next && next.senderId === message.senderId && sameDay(next.createdAt, message.createdAt);
                const sender = memberMap.get(message.senderId);

                return (
                  <div key={message.id} id={`msg-${message.id}`}>
                    {showDivider && (
                      <div className="my-3 flex items-center justify-center">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink-400 shadow-sm dark:bg-ink-800">
                          {formatDayLabel(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={
                        highlightId === message.id
                          ? "-mx-2 rounded-xl bg-accent-100/60 px-2 py-0.5 transition dark:bg-accent-900/30"
                          : "py-0.5"
                      }
                    >
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        showAvatar={!sameSenderAsNext}
                        showSenderName={chat.type === "group" && !sameSenderAsPrev}
                        sender={sender}
                        replyToMessage={message.replyToId ? messageMap.get(message.replyToId) : null}
                        onReply={setReplyTo}
                        onJumpTo={handleJumpTo}
                      />
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {typingUsers.length > 0 && (
          <div className="border-t border-ink-100 bg-white px-4 py-2 dark:border-ink-800 dark:bg-ink-900">
            <div className="mx-auto w-full max-w-5xl">
              <TypingIndicator users={typingUsers} />
            </div>
          </div>
        )}
        <MessageComposer chatId={chat.id} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={handleSend} />
      </div>

      {searchOpen && <SearchPanel chatId={chat.id} onJumpTo={handleJumpTo} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
