import { Router } from "express";
import { db, publicUser } from "../db.js";
import { authMiddleware } from "../auth.js";
import { isUserOnline } from "../wsHub.js";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
  const users = [...db.users.values()]
    .filter((u) => u.id !== req.userId)
    .map((u) => ({ ...publicUser(u), status: isUserOnline(u.id) ? "online" : "offline" }));
  res.json({ users });
});

export default router;
