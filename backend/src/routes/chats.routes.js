import { Router } from "express";
import { db, createChat, publicUser } from "../db.js";
import { authMiddleware } from "../auth.js";
import { sendToUser, isUserOnline } from "../wsHub.js";

const router = Router();

function serializeChat(chat, viewerId) {
  const members = chat.memberIds.map((id) => {
    const u = db.users.get(id);
    return u ? { ...publicUser(u), status: isUserOnline(u.id) ? "online" : "offline" } : null;
  }).filter(Boolean);

  const ids = db.chatMessageIds.get(chat.id) || [];
  const lastMessage = ids.length ? db.messages.get(ids[ids.length - 1]) : null;

  return {
    id: chat.id,
    type: chat.type,
    name: chat.name,
    members,
    createdAt: chat.createdAt,
    lastMessage,
  };
}

router.get("/", authMiddleware, (req, res) => {
  const chats = [...db.chats.values()]
    .filter((c) => c.memberIds.includes(req.userId))
    .map((c) => serializeChat(c, req.userId))
    .sort((a, b) => (b.lastMessage?.createdAt || b.createdAt) - (a.lastMessage?.createdAt || a.createdAt));
  res.json({ chats });
});

router.post("/", authMiddleware, (req, res) => {
  const { type, name, memberIds } = req.body || {};
  if (!type || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: "type and memberIds are required" });
  }
  const allMembers = [...new Set([req.userId, ...memberIds])];

  if (type === "direct" && allMembers.length === 2) {
    const existing = [...db.chats.values()].find(
      (c) =>
        c.type === "direct" &&
        c.memberIds.length === 2 &&
        c.memberIds.every((id) => allMembers.includes(id))
    );
    if (existing) return res.json({ chat: serializeChat(existing, req.userId) });
  }

  if (type === "group" && !name) {
    return res.status(400).json({ error: "Group chats require a name" });
  }

  const chat = createChat({ type, name, memberIds: allMembers, createdBy: req.userId });
  const serialized = serializeChat(chat, req.userId);

  allMembers
    .filter((id) => id !== req.userId)
    .forEach((id) => sendToUser(id, { type: "chat:new", payload: serialized }));

  res.status(201).json({ chat: serialized });
});

export default router;
