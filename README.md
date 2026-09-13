# Chatly — Real-Time Chat Application

A full-stack real-time chat application built for the Advanced Frontend Task brief:
**React + TypeScript + Tailwind CSS** frontend, backed by a **REST API + WebSocket**
Node/Express server.

This is a complete, runnable project — not a static mockup. The backend keeps data
in memory (no database setup required) and is meant as a realistic reference
implementation you can run locally, read through, and swap for a real database/auth
provider later.

---

## ✅ Feature checklist

- [x] User authentication (JWT) and protected routes
- [x] One-to-one and group chat
- [x] Real-time messaging over WebSockets
- [x] Online/offline presence
- [x] Typing indicators (debounced, auto-expiring)
- [x] Message delivery + read receipts (sent → delivered → read)
- [x] Edit, delete, reply, copy, and emoji react on messages
- [x] Optimistic UI for sending, with failed-message retry
- [x] Unread message counts per chat
- [x] Message search with debouncing (per-conversation)
- [x] Image/document sharing with upload progress
- [x] Infinite scroll / cursor-based message pagination
- [x] WebSocket reconnection with exponential backoff
- [x] Loading, empty, and error states throughout
- [x] Responsive layout + dark/light mode
- [x] Typed REST client, Zustand state stores, componentized architecture

---

## 🗂 Project structure

```
chat-app/
├── backend/                 Node + Express + ws (WebSocket) mock server
│   ├── src/
│   │   ├── server.js        App entrypoint
│   │   ├── db.js            In-memory data store + seed data
│   │   ├── auth.js          JWT sign/verify + auth middleware
│   │   ├── wsHub.js         WebSocket connection hub, presence, typing
│   │   └── routes/          auth, users, chats, messages, upload
│   └── uploads/              Uploaded files served statically
│
└── frontend/                 React + TypeScript + Tailwind (Vite)
    └── src/
        ├── types/             Shared TS types
        ├── lib/                api.ts (REST client), socket.ts (WS client)
        ├── store/              Zustand stores: auth, chat, ui
        ├── hooks/              useDebounce, useInfiniteScrollTop, useWebSocketBridge
        ├── components/
        │   ├── auth/           AuthShell, ProtectedRoute
        │   ├── layout/         Sidebar
        │   ├── chat/           ChatWindow, MessageBubble, MessageComposer, ...
        │   └── common/         Avatar, States, ToastStack, ThemeToggle
        ├── pages/              LoginPage, RegisterPage, ChatPage
        └── utils/              formatting helpers
```

---

## 🚀 Running it locally

You'll need **Node.js 18+**. Two terminals — one for each app.

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

This starts the API + WebSocket server on **http://localhost:4000**
(WebSocket at `ws://localhost:4000/ws`). On boot it prints seeded demo accounts.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` and `/uploads` to the backend,
so no `.env` configuration is needed for local development.

### Demo accounts

The backend seeds six users (password for all: `password123`):

- shashank@demo.io
- supreeth@demo.io
- vishal@demo.io
- vijay@demo.io
- shreya@demo.io
- rahul@demo.io

Log in as two different users in two browser windows (e.g. one normal, one
incognito) to see real-time delivery, typing indicators, and presence update
live between them.

---

## 🧠 Architecture notes

- **State management**: Zustand, split into `authStore`, `chatStore`, and
  `uiStore`. `chatStore` is the single source of truth for chats, messages
  (keyed by chat id), typing state, unread counts, and pagination cursors.
- **Optimistic sending**: `sendMessage` immediately appends a local message
  with `status: "sending"` and a `clientId`. When the server responds (or the
  WebSocket echoes the persisted message), it's reconciled by `clientId`. On
  failure the message flips to `status: "failed"` with a retry action.
- **WebSocket client** (`lib/socket.ts`): a small class that owns the socket
  lifecycle, exposes `send`/`on`/`onStateChange`, and reconnects automatically
  with exponential backoff (capped at 15s) whenever the connection drops
  unexpectedly. Connection state (`connecting` / `open` / `reconnecting` /
  `closed`) is surfaced in the sidebar.
- **Typing indicators**: the composer sends `typing:start`/`typing:stop`
  events; the server re-broadcasts to other chat members and auto-expires a
  stale "typing" state after 4s of silence.
- **Pagination**: messages are fetched newest-first in pages of 25 via a
  cursor (`nextCursor`/`hasMore`), loaded on scroll-to-top with scroll
  position preserved after prepending older messages.
- **File uploads**: handled via `XMLHttpRequest` (not `fetch`) specifically to
  get upload progress events, rendered as a per-attachment progress bar in the
  composer before the message is sent.

---

## ⚠️ About this backend

This server is intentionally a lightweight **mock/reference backend**: data is
stored in memory (resets on restart), passwords are stored in plaintext, and
the JWT secret is hard-coded. It's built to make the frontend fully
functional and demonstrable end-to-end — swap in a real database, password
hashing (bcrypt), and a proper secret-management setup before using anything
like this in production.

### Read receipts

Read receipts are sent in real time: when a recipient opens a conversation and is at the latest messages, unread incoming messages are marked as read. The backend sends the read status directly to the message sender over WebSocket, and read status is never downgraded back to delivered by the delivery simulation.
