export class CreateGameDto {
  playerId: string;
  playerName: string;
  /** Só 2 ou 4 (pares). */
  maxPlayers: number;
  /** Time escolhido (0 ou 1). Default 0. */
  teamId?: number;
}
