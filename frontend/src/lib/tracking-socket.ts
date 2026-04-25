import { io, Socket } from "socket.io-client";
import { safeStorage } from "./utils";

let socket: Socket | null = null;

const BACKEND_URL =
  typeof window !== "undefined" && process.env.NODE_ENV === "production"
    ? "" // Same origin — connect via Next.js rewrites / same server
    : process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3001";

export function getTrackingSocket(): Socket {
  if (socket?.connected) return socket;

  const token = safeStorage.getItem("accessToken");

  socket = io(`${BACKEND_URL}/tracking`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("[Tracking] Connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("[Tracking] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Tracking] Connection error:", err.message);
  });

  return socket;
}

export function disconnectTrackingSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinTrackingRoom(requestId: string) {
  const s = getTrackingSocket();
  s.emit("join-tracking", { requestId });
}

export function leaveTrackingRoom(requestId: string) {
  if (socket) {
    socket.emit("leave-tracking", { requestId });
  }
}

export function sendLocationUpdate(data: {
  requestId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}) {
  if (socket?.connected) {
    socket.emit("location-update", data);
  }
}

export function sendStatusUpdate(requestId: string, status: string) {
  if (socket?.connected) {
    socket.emit("status-update", { requestId, status });
  }
}

export function sendEtaUpdate(
  requestId: string,
  etaMinutes: number,
  distanceKm: number,
) {
  if (socket?.connected) {
    socket.emit("eta-update", { requestId, etaMinutes, distanceKm });
  }
}
