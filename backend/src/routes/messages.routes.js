import { Router } from "express";
import { db, addMessage, getChatMessages } from "../db.js";
import { authMiddleware } from "../auth.js";
import { broadcastToChat, sendToUser } from "../wsHub.js";

const router = Router();

function assertMember(req, res, chatId) {
  const chat = db.chats.get(chatId);
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return null;
  }
  if (!chat.memberIds.includes(req.userId)) {
    res.status(403).json({ error: "Not a member of this chat" });
    return null;
  }
  return chat;
}

// GET /api/chats/:chatId/messages?cursor=&limit=
router.get("/chats/:chatId/messages", authMiddleware, (req, res) => {
  const chat = assertMember(req, res, req.params.chatId);
  if (!chat) return;
  const { cursor, limit } = req.query;
  const page = getChatMessages(chat.id, {
    cursor: cursor || undefined,
    limit: limit ? Number(limit) : 25,
  });
  res.json(page);
});

// GET /api/chats/:chatId/search?q=
router.get("/chats/:chatId/search", authMiddleware, (req, res) => {
  const chat = assertMember(req, res, req.params.chatId);
  if (!chat) return;
  const q = (req.query.q || "").toString().trim().toLowerCase();
  if (!q) return res.json({ results: [] });
  const ids = db.chatMessageIds.get(chat.id) || [];
  const results = ids
    .map((id) => db.messages.get(id))
    .filter((m) => !m.deleted && m.text.toLowerCase().includes(q))
    .slice(-50);
  res.json({ results });
});

// POST /api/chats/:chatId/messages
router.post("/chats/:chatId/messages", authMiddleware, (req, res) => {
  const chat = assertMember(req, res, req.params.chatId);
  if (!chat) return;
  const { text, attachments, replyToId, clientId } = req.body || {};
  if (!text && !(attachments && attachments.length)) {
    return res.status(400).json({ error: "Message requires text or an attachment" });
  }
  const message = addMessage(chat.id, {
    senderId: req.userId,
    text: text || "",
    attachments,
    replyToId,
  });
  const payload = { ...message, clientId };

  // A sent message definitively ends the sender's typing state. Broadcast the
  // stop before the new message so peers cannot briefly show stale typing after
  // the message appears.
  broadcastToChat(chat.id, {
    type: "typing:stop",
    payload: { chatId: chat.id, userId: req.userId },
  }, [req.userId]);
  broadcastToChat(chat.id, { type: "message:new", payload }, [req.userId]);
  res.status(201).json({ message: payload });

  // simulate delivery receipt shortly after
  setTimeout(() => {
    if (message.status === "read") return;
    message.status = "delivered";
    broadcastToChat(chat.id, {
      type: "message:status",
      payload: { messageId: message.id, chatId: chat.id, status: "delivered" },
    });
  }, 600);
});

// PATCH /api/messages/:id  { text }  (edit)
router.patch("/messages/:id", authMiddleware, (req, res) => {
  const message = db.messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (message.senderId !== req.userId) return res.status(403).json({ error: "Not your message" });
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "Text is required" });

  message.text = text;
  message.edited = true;
  message.updatedAt = Date.now();

  broadcastToChat(message.chatId, { type: "message:update", payload: message });
  res.json({ message });
});

// DELETE /api/messages/:id
router.delete("/messages/:id", authMiddleware, (req, res) => {
  const message = db.messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (message.senderId !== req.userId) return res.status(403).json({ error: "Not your message" });

  message.deleted = true;
  message.text = "";
  message.attachments = [];
  message.updatedAt = Date.now();

  broadcastToChat(message.chatId, { type: "message:update", payload: message });
  res.json({ message });
});

// POST /api/messages/:id/react  { emoji }
router.post("/messages/:id/react", authMiddleware, (req, res) => {
  const message = db.messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  const { emoji } = req.body || {};
  if (!emoji) return res.status(400).json({ error: "emoji is required" });

  const current = message.reactions[emoji] || [];
  message.reactions[emoji] = current.includes(req.userId)
    ? current.filter((id) => id !== req.userId)
    : [...current, req.userId];
  if (message.reactions[emoji].length === 0) delete message.reactions[emoji];

  broadcastToChat(message.chatId, { type: "message:update", payload: message });
  res.json({ message });
});

// POST /api/messages/:id/read
router.post("/messages/:id/read", authMiddleware, (req, res) => {
  const message = db.messages.get(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });

  const chat = assertMember(req, res, message.chatId);
  if (!chat) return;

  // Only the recipient can mark a message as read. Notify the sender directly
  // so their UI updates immediately instead of waiting for a refresh.
  if (message.senderId !== req.userId && message.status !== "read") {
    message.status = "read";
    sendToUser(message.senderId, {
      type: "message:status",
      payload: { messageId: message.id, chatId: message.chatId, status: "read" },
    });
  }

  res.json({ message });
});

export default router;
