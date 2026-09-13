import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import type { ConnectionState } from "@/types";

export function useWebSocketBridge() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("closed");
  const handleWsEvent = useChatStore((s) => s.handleWsEvent);

  useEffect(() => {
    const offEvent = socketService.on(handleWsEvent);
    const offState = socketService.onStateChange(setConnectionState);
    return () => {
      offEvent();
      offState();
    };
  }, [handleWsEvent]);

  return connectionState;
}
