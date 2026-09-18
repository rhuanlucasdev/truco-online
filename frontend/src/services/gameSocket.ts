/**
 * Cliente Socket.IO mínimo.
 * Socket fica na origem do backend (sem /api) — Nest gateway não usa o global prefix.
 */
import { io, type Socket } from "socket.io-client";
import type { GameView } from "./gameService";

function resolveSocketUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicit) return explicit;

  const api = import.meta.env.VITE_API_URL as string | undefined;
  if (!api) return "http://localhost:3000";
  if (api.startsWith("http")) return api.replace(/\/api\/?$/, "");
  // relativo (/api) → mesma origem; rewrite /socket.io no vercel.json
  return undefined;
}

export type GameSocketHandlers = {
  onState: (game: GameView) => void;
  onEnded?: (gameId: string) => void;
  onError?: (message: string) => void;
};

export function connectGameSocket(
  gameId: string,
  playerId: string,
  handlers: GameSocketHandlers,
): { disconnect: () => void } {
  const url = resolveSocketUrl();
  const socket: Socket = url
    ? io(url, { transports: ["websocket"] })
    : io({ transports: ["websocket"] });

  socket.on("connect", () => {
    socket.emit("room:join", { gameId, playerId });
  });

  socket.on("game:state", (game: GameView) => {
    handlers.onState(game);
  });

  socket.on("game:ended", (payload: { gameId: string }) => {
    handlers.onEnded?.(payload.gameId);
  });

  socket.on("connect_error", (err: Error) => {
    handlers.onError?.(err.message);
  });

  return {
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
