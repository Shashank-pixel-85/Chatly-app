export type PresenceStatus = "online" | "offline";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  status: PresenceStatus;
  lastSeen: number;
}

export type ChatType = "direct" | "group";

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  members: User[];
  createdAt: number;
  lastMessage: Message | null;
}

export type MessageStatus = "sending" | "failed" | "sent" | "delivered" | "read";

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  attachments: Attachment[];
  replyToId: string | null;
  status: MessageStatus;
  reactions: Record<string, string[]>;
  edited: boolean;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
  clientId?: string;
}

export interface PendingAttachment {
  id: string;
  file: File;
  progress: number;
  previewUrl?: string;
  uploaded?: Attachment;
  error?: string;
}

export type WsEvent =
  | { type: "message:new"; payload: Message }
  | { type: "message:update"; payload: Message }
  | { type: "message:status"; payload: { messageId: string; chatId: string; status: MessageStatus } }
  | { type: "typing:start"; payload: { chatId: string; userId: string } }
  | { type: "typing:stop"; payload: { chatId: string; userId: string } }
  | { type: "presence:update"; payload: { userId: string; status: PresenceStatus; lastSeen: number } }
  | { type: "chat:new"; payload: Chat };

export type ConnectionState = "connecting" | "open" | "closed" | "reconnecting";
