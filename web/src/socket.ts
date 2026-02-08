import { io } from "socket.io-client";

export const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  upgrade: false,
});

export const AGENT_SECRET =
  process.env.NEXT_PUBLIC_AGENT_SECRET_KEY || "";

export const emitSecure = (event: string, payload?: Record<string, unknown>) => {
  socket.emit(event, { ...(payload || {}), secret: AGENT_SECRET });
};
