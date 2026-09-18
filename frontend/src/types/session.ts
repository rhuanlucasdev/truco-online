/**
 * Sessão local: identidade do jogador + id da mesa.
 * Usada na waiting room e na mesa de jogo.
 */
export type PlayerSession = {
  gameId: string;
  playerName: string;
  playerId: string;
};

/** @deprecated alias — waiting room usa a mesma forma */
export type WaitingRoomSession = PlayerSession;
