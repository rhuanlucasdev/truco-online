/**
 * Casos de uso da partida.
 */
import { request } from "./api";

export type PlayerIdentity = {
  playerId: string;
  playerName: string;
};

export type CreateGameBody = PlayerIdentity & {
  maxPlayers: 2 | 4;
  teamId: 0 | 1;
};

export type JoinGameBody = PlayerIdentity & {
  /** Obrigatório em entrada nova; no rejoin o backend ignora. */
  teamId?: 0 | 1;
};

export type GameStatus = "WAITING" | "PLAYING" | "FINISHED";

export type Carta = {
  naipe: string;
  value: string;
};

export type Jogada = {
  playerId: string;
  card: Carta;
};

export type PlayerView = {
  playerId: string;
  name: string;
  teamId: 0 | 1;
  connected: boolean;
  hand: Carta[];
  handCount: number;
};

export type GameView = {
  id: string;
  hostPlayerId: string;
  maxPlayers: 2 | 4;
  playersList: PlayerView[];
  gameStatus: GameStatus;
  vira: Carta | null;
  manilha: string | null;
  currentPlayerId: string;
  currentRound: Jogada[];
  roundWinners: (string | null)[];
  teamScores: [number, number];
  deckCount: number;
};

export type Game = GameView;

type PlayCardBody = {
  playerId: string;
  naipe: string;
  value: string;
};

export async function createGame(body: CreateGameBody) {
  return request<GameView>("POST", "/game", body);
}

export async function joinGame(gameId: string, body: JoinGameBody) {
  return request<GameView>("PATCH", `/game/${gameId}`, body);
}

export async function getGame(gameId: string, playerId: string) {
  const qs = new URLSearchParams({ playerId });
  return request<GameView>("GET", `/game/${gameId}?${qs}`);
}

export async function playCard(gameId: string, body: PlayCardBody) {
  return request<GameView>("POST", `/game/${gameId}/play`, body);
}

export async function deleteGame(gameId: string, playerId: string) {
  return request<{ id: string; deleted: boolean }>("DELETE", `/game/${gameId}`, {
    playerId,
  });
}

export async function leaveGame(gameId: string, playerId: string) {
  return request<{ id: string; left: boolean; deleted: boolean }>(
    "POST",
    `/game/${gameId}/leave`,
    { playerId },
  );
}

export async function setTeam(
  gameId: string,
  playerId: string,
  teamId: 0 | 1,
) {
  return request<GameView>("POST", `/game/${gameId}/team`, {
    playerId,
    teamId,
  });
}
