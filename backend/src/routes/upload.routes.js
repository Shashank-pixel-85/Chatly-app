import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { authMiddleware } from "../auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

// POST /api/upload  (multipart/form-data, field name "file")
router.post("/", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.status(201).json({
    attachment: {
      id: uuid(),
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    },
  });
});

export default router;
