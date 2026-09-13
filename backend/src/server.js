import express from "express";
import cors from "cors";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { seed } from "./db.js";
import { createWsHub } from "./wsHub.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import chatsRoutes from "./routes/chats.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api", messagesRoutes); // /api/chats/:chatId/messages, /api/messages/:id...
app.use("/api/upload", uploadRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
createWsHub(server);

const { demoUsers } = seed();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Chat backend running on http://localhost:${PORT}`);
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/ws\n`);
  console.log("Demo accounts (password: password123):");
  demoUsers.forEach((u) => console.log(`  - ${u.email}`));
  console.log("");
});
