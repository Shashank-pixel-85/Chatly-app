import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, publicUser } from "../db.js";
import { signToken, authMiddleware } from "../auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  const exists = [...db.users.values()].some((u) => u.email === email);
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const id = uuid();
  const palette = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6", "#EF4444"];
  const user = {
    id,
    name,
    email,
    password,
    avatarColor: palette[db.users.size % palette.length],
    status: "online",
    lastSeen: Date.now(),
  };
  db.users.set(id, user);

  const token = signToken(id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = [...db.users.values()].find((u) => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", authMiddleware, (req, res) => {
  const user = db.users.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

export default router;
