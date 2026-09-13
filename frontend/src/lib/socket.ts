import type { ConnectionState, WsEvent } from "@/types";

type Listener = (event: WsEvent) => void;
type StateListener = (state: ConnectionState) => void;

const MAX_BACKOFF = 15000;
const BASE_BACKOFF = 800;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private stateListeners = new Set<StateListener>();
  private token: string | null = null;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private state: ConnectionState = "closed";
  private outbox: string[] = [];

  connect(token: string) {
    // Avoid opening multiple sockets for the same authenticated session.
    if (this.token === token && this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws) {
      this.intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.token = token;
    this.intentionalClose = false;
    this.attempt = 0;
    this.outbox = [];
    this.open();
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.setState("closed");
  }

  private open() {
    if (!this.token) return;
    this.setState(this.attempt === 0 ? "connecting" : "reconnecting");

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = import.meta.env.DEV ? "localhost:4000" : window.location.host;
    const url = `${protocol}://${host}/ws?token=${encodeURIComponent(this.token)}`;

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0;
      this.setState("open");
      this.flushOutbox();
    };

    ws.onmessage = (evt) => {
      try {
        const parsed: WsEvent = JSON.parse(evt.data);
        this.listeners.forEach((l) => l(parsed));
      } catch {
        // ignore malformed payloads
      }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return; // stale socket
      this.setState("closed");
      if (!this.intentionalClose) this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private scheduleReconnect() {
    this.setState("reconnecting");
    const delay = Math.min(BASE_BACKOFF * 2 ** this.attempt, MAX_BACKOFF);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private flushOutbox() {
    while (this.outbox.length) {
      const msg = this.outbox.shift();
      if (msg) this.ws?.send(msg);
    }
  }

  send(type: string, payload: unknown) {
    const data = JSON.stringify({ type, payload });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      return true;
    }

    // Never replay stale one-shot typing events. The dedicated typing state
    // below will re-announce active typing after a reconnect. Other messages
    // can still use the small outbox.
    if (type !== "typing:start" && type !== "typing:stop") {
      this.outbox.push(data);
      if (this.outbox.length > 20) this.outbox.shift();
    }
    return false;
  }


  setTyping(chatId: string, active: boolean) {
    this.send(active ? "typing:start" : "typing:stop", { chatId });
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onStateChange(listener: StateListener) {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.stateListeners.forEach((l) => l(state));
  }

  getState() {
    return this.state;
  }
}

export const socketService = new SocketService();
