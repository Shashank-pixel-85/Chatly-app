// Simple in-memory data store. Restarting the server resets all data.
import { v4 as uuid } from "uuid";

export const db = {
  users: new Map(), // id -> user
  chats: new Map(), // id -> chat
  messages: new Map(), // id -> message
  chatMessageIds: new Map(), // chatId -> [messageId,...] ordered oldest->newest
};

function seedUser(name, email, colorIdx) {
  const id = uuid();
  const user = {
    id,
    name,
    email,
    password: "password123", // plaintext only because this is a disposable mock/demo backend
    avatarColor: [
      "#6366F1",
      "#EC4899",
      "#14B8A6",
      "#F59E0B",
      "#8B5CF6",
      "#EF4444",
    ][colorIdx % 6],
    status: "offline",
    lastSeen: Date.now(),
  };
  db.users.set(id, user);
  return user;
}

export function seed() {
  const shashank = seedUser("Shashank Hiremath", "shashank@demo.io", 0);
  const supreeth = seedUser("Supreeth", "supreeth@demo.io", 1);
  const vishal = seedUser("Vishal", "vishal@demo.io", 2);
  const vijay = seedUser("Vijay", "vijay@demo.io", 3);
  const shreya = seedUser("Shreya", "shreya@demo.io", 4);
  const rahul = seedUser("Rahul", "rahul@demo.io", 5);

  const direct = createChat({
    type: "direct",
    memberIds: [shashank.id, supreeth.id],
  });
  const group = createChat({
    type: "group",
    name: "Design Team",
    memberIds: [shashank.id, supreeth.id, vishal.id, vijay.id, shreya.id, rahul.id],
    createdBy: shashank.id,
  });

  addMessage(direct.id, {
    senderId: supreeth.id,
    text: "Hey Shashank! Did you get a chance to look at the mockups?",
  });
  addMessage(direct.id, {
    senderId: shashank.id,
    text: "Yep, just checked them. Looking good so far 👍",
  });
  addMessage(group.id, {
    senderId: shreya.id,
    text: "Hey team! The design review is at 3pm today.",
  });

  return { demoUsers: [shashank, supreeth, vishal, vijay, shreya, rahul] };
}

export function createChat({ type, name, memberIds, createdBy }) {
  const id = uuid();
  const chat = {
    id,
    type, // 'direct' | 'group'
    name: name || null,
    memberIds,
    createdBy: createdBy || memberIds[0],
    createdAt: Date.now(),
  };
  db.chats.set(id, chat);
  db.chatMessageIds.set(id, []);
  return chat;
}

export function addMessage(chatId, { senderId, text, attachments, replyToId }) {
  const id = uuid();
  const message = {
    id,
    chatId,
    senderId,
    text: text || "",
    attachments: attachments || [],
    replyToId: replyToId || null,
    status: "sent", // sent -> delivered -> read
    reactions: {}, // emoji -> [userId]
    edited: false,
    deleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.messages.set(id, message);
  db.chatMessageIds.get(chatId).push(id);
  return message;
}

export function getChatMessages(chatId, { cursor, limit = 25 } = {}) {
  const ids = db.chatMessageIds.get(chatId) || [];
  let endIndex = ids.length;
  if (cursor) {
    const cursorIdx = ids.indexOf(cursor);
    if (cursorIdx !== -1) endIndex = cursorIdx;
  }
  const startIndex = Math.max(0, endIndex - limit);
  const pageIds = ids.slice(startIndex, endIndex);
  return {
    messages: pageIds.map((id) => db.messages.get(id)),
    hasMore: startIndex > 0,
    nextCursor: startIndex > 0 ? pageIds[0] : null,
  };
}

export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
