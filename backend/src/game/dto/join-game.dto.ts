export class JoinGameDto {
  playerId: string;
  playerName: string;
  /** Time escolhido (0 ou 1). Obrigatório em entrada nova; ignorado no rejoin. */
  teamId?: number;
}
