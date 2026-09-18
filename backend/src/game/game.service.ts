import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto.js';
import { JoinGameDto } from './dto/join-game.dto.js';
import { DeckService, Carta } from './deck/deck.service.js';
import { PlayCardDto } from './dto/play-card.dto.js';

export interface Jogada {
  playerId: string;
  card: Carta;
}

type TeamId = 0 | 1;

type Player = {
  playerId: string;
  name: string;
  hand: Carta[];
  teamId: TeamId;
  /** false = saiu da UI mas ainda está na mesa (rejoin com mesmo playerId). */
  connected: boolean;
};

type GameRecord = {
  id: string;
  hostPlayerId: string;
  maxPlayers: 2 | 4;
  playersList: Player[];
  gameStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
  deck: Carta[];
  vira: Carta | null;
  currentPlayerId: string;
  currentRound: Jogada[];
  /** playerId do vencedor de cada rodada da mão (null = empate). */
  roundWinners: (string | null)[];
  teamScores: [number, number];
};

@Injectable()
export class GameService {
  constructor(private deckService: DeckService) {}

  private Game: GameRecord[] = [];

  /**
   * Visão “segura” do jogo para um jogador:
   * - você vê a própria mão
   * - outros: só handCount
   * - deck completo NÃO vai pro cliente
   */
  getGameForPlayer(gameId: string, playerId: string) {
    if (!playerId) {
      throw new HttpException(
        'playerId e obrigatorio (query ?playerId=)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const game = this.findGame(gameId);
    this.findPlayer(game, playerId);

    const manilha = game.vira ? this.deckService.getManilha(game.vira) : null;

    return {
      id: game.id,
      hostPlayerId: game.hostPlayerId,
      maxPlayers: game.maxPlayers,
      gameStatus: game.gameStatus,
      vira: game.vira,
      manilha,
      currentPlayerId: game.currentPlayerId,
      currentRound: game.currentRound,
      roundWinners: game.roundWinners,
      teamScores: game.teamScores,
      deckCount: game.deck.length,
      playersList: game.playersList.map((player) => {
        const isMe = player.playerId === playerId;
        return {
          playerId: player.playerId,
          name: player.name,
          teamId: player.teamId,
          connected: player.connected,
          hand: isMe ? player.hand : [],
          handCount: player.hand.length,
        };
      }),
    };
  }

  createGame(createGameDto: CreateGameDto) {
    const maxPlayers = createGameDto.maxPlayers;

    if (maxPlayers !== 2 && maxPlayers !== 4) {
      throw new HttpException(
        'maxPlayers deve ser 2 ou 4',
        HttpStatus.BAD_REQUEST,
      );
    }

    const teamId = this.parseTeamId(createGameDto.teamId, 0) ?? 0;

    const newId = (this.Game.length + 1).toString();
    const newGame: GameRecord = {
      id: newId,
      hostPlayerId: createGameDto.playerId,
      maxPlayers,
      playersList: [
        {
          playerId: createGameDto.playerId,
          name: createGameDto.playerName,
          hand: [],
          teamId,
          connected: true,
        },
      ],
      gameStatus: 'WAITING',
      deck: this.deckService.createDeck(),
      vira: null,
      currentPlayerId: createGameDto.playerId,
      currentRound: [],
      roundWinners: [],
      teamScores: [0, 0],
    };

    this.Game.push(newGame);
    return this.getGameForPlayer(newId, createGameDto.playerId);
  }

  joinGame(gameId: string, joinGameDto: JoinGameDto) {
    const findGame = this.findGame(gameId);

    const existing = findGame.playersList.find(
      (player) => player.playerId === joinGameDto.playerId,
    );

    // Rejoin: mesmo playerId que desconectou (em geral durante PLAYING).
    if (existing) {
      if (existing.connected) {
        throw new HttpException(
          'O mesmo jogador ja esta conectado na partida',
          HttpStatus.UNAUTHORIZED,
        );
      }
      existing.connected = true;
      existing.name = joinGameDto.playerName || existing.name;
      return findGame;
    }

    if (findGame.gameStatus !== 'WAITING') {
      throw new HttpException(
        'Partida ja comecou — so e possivel reentrar com o mesmo playerId',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (findGame.playersList.length >= findGame.maxPlayers) {
      throw new HttpException('Mesa cheia', HttpStatus.BAD_REQUEST);
    }

    const teamId = this.parseTeamId(joinGameDto.teamId, null);
    if (teamId === null) {
      throw new HttpException(
        'teamId e obrigatorio (0 ou 1)',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.assertTeamHasSeat(findGame, teamId);

    findGame.playersList.push({
      playerId: joinGameDto.playerId,
      name: joinGameDto.playerName,
      hand: [],
      teamId,
      connected: true,
    });

    if (findGame.playersList.length === findGame.maxPlayers) {
      this.startGame(findGame);
    }

    return findGame;
  }

  /**
   * Sai da mesa:
   * - WAITING: remove o jogador (vaga libera). Se era o único, apaga a mesa.
   *   Se era host e sobram gente, passa o host ao próximo.
   * - PLAYING: marca connected=false (pode rejoin com o mesmo playerId).
   */
  leaveGame(gameId: string, playerId: string) {
    const game = this.findGame(gameId);
    const player = this.findPlayer(game, playerId);

    if (game.gameStatus === 'WAITING') {
      game.playersList = game.playersList.filter((p) => p.playerId !== playerId);

      if (game.playersList.length === 0) {
        const index = this.Game.findIndex((g) => g.id === gameId);
        this.Game.splice(index, 1);
        return { id: gameId, left: true, deleted: true };
      }

      if (game.hostPlayerId === playerId) {
        game.hostPlayerId = game.playersList[0].playerId;
      }

      return { id: gameId, left: true, deleted: false };
    }

    // PLAYING / FINISHED: desconecta sem remover (mão e time preservados).
    player.connected = false;

    if (game.currentPlayerId === playerId) {
      this.skipToNextConnected(game);
    }

    return { id: gameId, left: true, deleted: false };
  }

  /** Troca de time só na waiting room. */
  setTeam(gameId: string, playerId: string, rawTeamId: number) {
    const game = this.findGame(gameId);

    if (game.gameStatus !== 'WAITING') {
      throw new HttpException(
        'So e possivel trocar de time na sala de espera',
        HttpStatus.BAD_REQUEST,
      );
    }

    const player = this.findPlayer(game, playerId);
    const teamId = this.parseTeamId(rawTeamId, null);
    if (teamId === null) {
      throw new HttpException('teamId deve ser 0 ou 1', HttpStatus.BAD_REQUEST);
    }

    if (player.teamId === teamId) {
      return this.getGameForPlayer(gameId, playerId);
    }

    this.assertTeamHasSeat(game, teamId, playerId);
    player.teamId = teamId;

    return this.getGameForPlayer(gameId, playerId);
  }

  /**
   * Só o anfitrião pode apagar. Remove da memória.
   */
  deleteGame(gameId: string, playerId: string) {
    const game = this.findGame(gameId);

    if (game.hostPlayerId !== playerId) {
      throw new HttpException(
        'Somente o anfitriao pode apagar a mesa',
        HttpStatus.FORBIDDEN,
      );
    }

    const index = this.Game.findIndex((g) => g.id === gameId);
    this.Game.splice(index, 1);

    return { id: gameId, deleted: true };
  }

  playCard(gameId: string, playCardDto: PlayCardDto) {
    const game = this.findGame(gameId);

    if (game.gameStatus !== 'PLAYING') {
      throw new HttpException(
        'Partida nao esta em andamento',
        HttpStatus.BAD_REQUEST,
      );
    }

    const player = this.findPlayer(game, playCardDto.playerId);
    if (!player.connected) {
      throw new HttpException(
        'Jogador desconectado — reentre na partida',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.validateCurrentPlayer(game, playCardDto.playerId);

    const card = this.findCard(player, playCardDto.naipe, playCardDto.value);
    const playedCard = this.removeCard(player, card);

    game.currentRound.push({
      playerId: player.playerId,
      card: playedCard,
    });

    if (game.currentRound.length === game.maxPlayers) {
      this.finishRound(game);
    } else {
      this.switchTurn(game);
    }

    return this.getGameForPlayer(gameId, playCardDto.playerId);
  }

  findManilha(gameId: string) {
    const game = this.findGame(gameId);
    const vira = game.vira;

    if (!vira) {
      throw new HttpException(
        'Nao foi encontrado a vira dessa rodada',
        HttpStatus.BAD_REQUEST,
      );
    }

    const manilha = this.deckService.getManilha(vira);

    return {
      manilha,
      players: game.playersList.map((p) => ({
        playerId: p.playerId,
        manilhas: p.hand.filter((c) => c.value == manilha),
      })),
    };
  }

  // --- início / deal ---

  private startGame(game: GameRecord) {
    game.gameStatus = 'PLAYING';
    this.deckService.shuffleDeck(game.deck);
    this.dealHands(game);
    game.currentPlayerId = game.playersList[0].playerId;
    game.currentRound = [];
    game.roundWinners = [];
  }

  private dealHands(game: GameRecord) {
    const { hands, vira } = this.deckService.dealCards(
      game.deck,
      game.maxPlayers,
    );

    game.playersList.forEach((player, index) => {
      player.hand = hands[index];
    });
    game.vira = vira;
  }

  // --- rodada / mão ---

  private finishRound(game: GameRecord) {
    const lastToPlay =
      game.currentRound[game.currentRound.length - 1]?.playerId ??
      game.currentPlayerId;

    const winnerPlayerId = this.getRoundWinner(game);
    game.roundWinners.push(winnerPlayerId);
    game.currentRound = [];

    if (this.isHandDrawn(game)) {
      this.redealHand(game, game.playersList[0].playerId);
      return;
    }

    const handWinnerTeam = this.checkHandWinner(game);

    if (handWinnerTeam !== null) {
      this.finishHand(game, handWinnerTeam);
      return;
    }

    // Vencedor da rodada começa a próxima; empate → próximo circular do último.
    if (winnerPlayerId) {
      game.currentPlayerId = winnerPlayerId;
    } else {
      this.advanceTurnFrom(game, lastToPlay);
    }
  }

  private advanceTurnFrom(game: GameRecord, fromPlayerId: string) {
    game.currentPlayerId = fromPlayerId;
    this.skipToNextConnected(game);
  }

  private finishHand(game: GameRecord, teamId: TeamId) {
    game.teamScores[teamId] += 1;
    this.redealHand(
      game,
      game.playersList.find((p) => p.teamId === teamId)?.playerId ??
        game.playersList[0].playerId,
    );
  }

  private redealHand(game: GameRecord, starterPlayerId: string) {
    game.deck = this.deckService.createDeck();
    this.deckService.shuffleDeck(game.deck);
    this.dealHands(game);
    game.currentRound = [];
    game.roundWinners = [];
    game.currentPlayerId = starterPlayerId;
  }

  /**
   * Entre N jogadas, acha a carta mais forte.
   * Se duas ou mais empatam no topo → null.
   */
  private getRoundWinner(game: GameRecord): string | null {
    const manilha = this.deckService.getManilha(game.vira!);
    const plays = game.currentRound;

    let best = plays[0];

    for (let i = 1; i < plays.length; i++) {
      const result = this.deckService.compareCards(
        best.card,
        plays[i].card,
        manilha,
      );
      if (result === 2) best = plays[i];
    }

    const tiedWithBest = plays.filter(
      (p) => this.deckService.compareCards(best.card, p.card, manilha) === 0,
    );

    if (tiedWithBest.length > 1) return null;
    return best.playerId;
  }

  /**
   * Vencedor da mão = time que fechou 2 rodadas (ou regras de empate de rodada).
   * Retorna teamId ou null se a mão continua.
   */
  private checkHandWinner(game: GameRecord): TeamId | null {
    const team0Wins = game.roundWinners.filter((id) => {
      if (!id) return false;
      return this.findPlayer(game, id).teamId === 0;
    }).length;

    const team1Wins = game.roundWinners.filter((id) => {
      if (!id) return false;
      return this.findPlayer(game, id).teamId === 1;
    }).length;

    const first = game.roundWinners[0];
    const second = game.roundWinners[1];

    // 1ª empatada → quem ganhar a 2ª leva a mão.
    if (first === null && second) {
      return this.findPlayer(game, second).teamId;
    }
    if (second === null && first && game.roundWinners.length >= 2) {
      return this.findPlayer(game, first).teamId;
    }

    if (team0Wins >= 2) return 0;
    if (team1Wins >= 2) return 1;

    // 3ª rodada desempate (se 1-1)
    if (game.roundWinners.length >= 3) {
      const third = game.roundWinners[2];
      if (third) return this.findPlayer(game, third).teamId;
      // 3ª empatada com 1-1: quem ganhou a 1ª (regra comum) ou null → redistribui
      if (first) return this.findPlayer(game, first).teamId;
    }

    return null;
  }

  private isHandDrawn(game: GameRecord): boolean {
    return (
      game.roundWinners.length === 2 &&
      game.roundWinners[0] === null &&
      game.roundWinners[1] === null
    );
  }

  // --- helpers ---

  private findGame(gameId: string) {
    const game = this.Game.find((g) => g.id === gameId);
    if (!game) {
      throw new HttpException('Jogo nao encontrado', HttpStatus.NOT_FOUND);
    }
    return game;
  }

  private findPlayer(game: GameRecord, playerId: string) {
    const player = game.playersList.find((p) => p.playerId === playerId);
    if (!player) {
      throw new HttpException('Jogador nao encontrado', HttpStatus.NOT_FOUND);
    }
    return player;
  }

  private findCard(player: Player, naipe: string, value: string) {
    const card = player.hand.find((c) => c.naipe === naipe && c.value === value);
    if (!card) {
      throw new HttpException(
        'Carta nao encontrada na sua mao',
        HttpStatus.NOT_FOUND,
      );
    }
    return card;
  }

  private validateCurrentPlayer(game: GameRecord, playerId: string) {
    if (game.currentPlayerId !== playerId) {
      throw new HttpException('Nao e sua rodada', HttpStatus.UNAUTHORIZED);
    }
  }

  private removeCard(player: Player, card: Carta) {
    const cardIndex = player.hand.findIndex((h) => h === card);
    return player.hand.splice(cardIndex, 1)[0];
  }

  /** Próximo jogador conectado na ordem da mesa (circular). */
  private switchTurn(game: GameRecord) {
    this.skipToNextConnected(game);
  }

  private skipToNextConnected(game: GameRecord) {
    const n = game.playersList.length;
    if (n === 0) return;

    const start = game.playersList.findIndex(
      (p) => p.playerId === game.currentPlayerId,
    );
    const from = start >= 0 ? start : 0;

    for (let step = 1; step <= n; step++) {
      const next = game.playersList[(from + step) % n];
      if (next.connected) {
        game.currentPlayerId = next.playerId;
        return;
      }
    }
  }

  private parseTeamId(
    value: number | undefined,
    fallback: TeamId | null,
  ): TeamId | null {
    if (value === undefined || value === null) return fallback;
    if (value === 0 || value === 1) return value;
    return null;
  }

  /** Cada time cabe no máximo maxPlayers/2 jogadores. */
  private assertTeamHasSeat(
    game: GameRecord,
    teamId: TeamId,
    exceptPlayerId?: string,
  ) {
    const cap = game.maxPlayers / 2;
    const count = game.playersList.filter(
      (p) => p.teamId === teamId && p.playerId !== exceptPlayerId,
    ).length;

    if (count >= cap) {
      throw new HttpException(
        `Time ${teamId + 1} esta cheio`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
