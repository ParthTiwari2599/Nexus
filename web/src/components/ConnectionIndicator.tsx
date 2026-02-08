"use client";

import { useEffect, useState } from "react";
import { socket } from "@/socket";

export default function ConnectionIndicator() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${
          connected
            ? "border-green-500/40 text-green-400 bg-green-500/10"
            : "border-red-500/40 text-red-400 bg-red-500/10"
        }`}
      >
        {connected ? "CONNECTED" : "DISCONNECTED"}
      </div>
    </div>
  );
}
