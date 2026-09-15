import { request } from "./api";

/** Identidade do jogador no body de create/join (mesmo contrato no Nest). */
type PlayerIdentity = {
  playerId: string;
  playerName: string;
};

type GameStatus = "WAITING_PLAYER_2" | "PLAYING" | "FINISHED";

export type Carta = {
  naipe: string;
  value: string;
};

type Jogada = {
  playerId: string;
  card: Carta;
};

type Player = {
  playerId: string;
  name: string;
  hand: Carta[];
  score: number;
};

/** Estado da partida alinhado ao que o backend devolve. */
export type Game = {
  id: string;
  playersList: Player[];
  gameStatus: GameStatus;
  deck: Carta[];
  vira: Carta | null;
  currentPlayerId: string;
  currentRound: Jogada[];
  roundWinners: (string | null)[];
};

type PlayCardBody = {
  playerId: string;
  naipe: string;
  value: string;
};

/** Resposta mínima para a tela de criar (ainda WAITING, sem mesa completa). */
export type CreateGameResponse = Pick<Game, "id" | "gameStatus">;

export async function createGame(body: PlayerIdentity) {
  return request<CreateGameResponse>("POST", "/game", body);
}

export async function joinGame(gameId: string, body: PlayerIdentity) {
  return request<Game>("PATCH", `/game/${gameId}`, body);
}

export async function playCard(gameId: string, body: PlayCardBody) {
  return request("POST", `/game/${gameId}/play`, body);
}
