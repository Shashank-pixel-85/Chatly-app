import { WebSocketServer } from "ws";
import { verifyToken } from "./auth.js";
import { db, publicUser } from "./db.js";

// userId -> Set<WebSocket>
const connections = new Map();
// userId -> { chatId -> timeout } for typing auto-expiry
const typingTimers = new Map();

export function createWsHub(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    const userId = verifyToken(token);

    if (!userId || !db.users.has(userId)) {
      ws.close(4001, "Unauthorized");
      return;
    }

    if (!connections.has(userId)) connections.set(userId, new Set());
    connections.get(userId).add(ws);

    setUserStatus(userId, "online");

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      handleClientEvent(userId, msg);
    });

    ws.on("close", () => {
      // Clear any typing state owned by this connection so peers never get
      // stuck showing a user as typing after a disconnect/reconnect.
      for (const [key, timer] of typingTimers.entries()) {
        if (key.startsWith(`${userId}:`)) {
          clearTimeout(timer);
          typingTimers.delete(key);
          const chatId = key.slice(userId.length + 1);
          broadcastToChat(
            chatId,
            { type: "typing:stop", payload: { chatId, userId } },
            [userId]
          );
        }
      }

      const set = connections.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          connections.delete(userId);
          setUserStatus(userId, "offline");
        }
      }
    });

    // heartbeat
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(interval));

  return wss;
}

function handleClientEvent(userId, msg) {
  if (msg.type === "typing:start" || msg.type === "typing:stop") {
    const { chatId } = msg.payload || {};
    if (!chatId) return;
    const chat = db.chats.get(chatId);
    if (!chat || !chat.memberIds.includes(userId)) return;

    broadcastToChat(
      chatId,
      { type: msg.type, payload: { chatId, userId } },
      [userId]
    );

    const key = `${userId}:${chatId}`;
    if (msg.type === "typing:start") {
      clearTimeout(typingTimers.get(key));
      typingTimers.set(
        key,
        setTimeout(() => {
          typingTimers.delete(key);
          broadcastToChat(
            chatId,
            { type: "typing:stop", payload: { chatId, userId } },
            [userId]
          );
        }, 6000)
      );
    } else {
      clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);
    }
  }
}

function setUserStatus(userId, status) {
  const user = db.users.get(userId);
  if (!user) return;
  user.status = status;
  user.lastSeen = Date.now();
  // broadcast to everyone who shares a chat with this user
  const peers = new Set();
  for (const chat of db.chats.values()) {
    if (chat.memberIds.includes(userId)) {
      chat.memberIds.forEach((id) => peers.add(id));
    }
  }
  peers.forEach((peerId) => {
    sendToUser(peerId, {
      type: "presence:update",
      payload: { userId, status, lastSeen: user.lastSeen },
    });
  });
}

export function sendToUser(userId, event) {
  const set = connections.get(userId);
  if (!set) return false;
  const data = JSON.stringify(event);
  set.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });
  return true;
}

export function broadcastToChat(chatId, event, excludeUserIds = []) {
  const chat = db.chats.get(chatId);
  if (!chat) return;
  chat.memberIds
    .filter((id) => !excludeUserIds.includes(id))
    .forEach((id) => sendToUser(id, event));
}

export function isUserOnline(userId) {
  const set = connections.get(userId);
  return !!set && set.size > 0;
}
