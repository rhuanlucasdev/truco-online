/**
 * Cliente Socket.IO mínimo.
 */
import { io, type Socket } from "socket.io-client";
import type { GameView } from "./gameService";

const base = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  const socket: Socket = io(base, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    socket.emit("room:join", { gameId, playerId });
  });

  socket.on("game:state", (game: GameView) => {
    handlers.onState(game);
  });

  socket.on("game:ended", (payload: { gameId: string }) => {
    handlers.onEnded?.(payload.gameId);
  });

  socket.on("connect_error", (err) => {
    handlers.onError?.(err.message);
  });

  return {
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
