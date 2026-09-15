import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto.js';
import { JoinGameDto } from './dto/join-game.dto.js';
import { DeckService, Carta } from './deck/deck.service.js';
import { PlayCardDto } from './dto/play-card.dto.js';

export interface Jogada {
  playerId: string;
  card: Carta;
}

@Injectable()
export class GameService {
  constructor(private deckService: DeckService) {}
  private Game = [
    {
      id: '1',
      playersList: [
        {
          playerId: '1',
          name: 'Rhuan',
          hand: [] as Carta[],
          score: 0,
        },
      ],
      gameStatus: 'WAITING_PLAYER_2',
      deck: [] as Carta[],
      vira: null as Carta | null,
      currentPlayerId: '1',
      currentRound: [] as Jogada[],
      roundWinners: [] as (string | null)[],
    },
  ];

  // 1. Acoes publicas da API
  createGame(createGameDto: CreateGameDto) {
    const newId = this.Game.length + 1;
    const newGame = {
      id: newId.toString(),
      playersList: [
        {
          playerId: createGameDto.playerId,
          name: createGameDto.playerName,
          hand: [] as Carta[],
          score: 0,
        },
      ],
      gameStatus: 'WAITING_PLAYER_2',
      deck: this.deckService.createDeck(),
      vira: null as Carta | null,
      currentPlayerId: createGameDto.playerId,
      currentRound: [] as Jogada[],
      roundWinners: [] as (string | null)[],
    };

    this.Game.push(newGame);

    return newGame;
  }

  joinGame(gameId: string, joinGameDto: JoinGameDto) {
    // acha o jogo pelo ID passado na URL
    const findGame = this.Game.find((game) => game.id == gameId);

    if (!findGame)
      throw new HttpException('Jogo nao encontrado', HttpStatus.NOT_FOUND);

    if (findGame.gameStatus != 'WAITING_PLAYER_2')
      throw new HttpException(
        'Nao foi possivel entrar nessa partida',
        HttpStatus.BAD_REQUEST,
      );

    // Verifica se o ID do player passado na bodyRequest e igual ao id ja no jogo
    const playerInGame = findGame.playersList.some(
      (player) => player.playerId == joinGameDto.playerId,
    );

    if (playerInGame)
      throw new HttpException(
        'O mesmo jogador ja esta na partida',
        HttpStatus.UNAUTHORIZED,
      );

    const newPlayer = {
      playerId: joinGameDto.playerId,
      name: joinGameDto.playerName,
      hand: [] as Carta[],
      score: 0,
    };

    findGame.playersList.push(newPlayer);
    findGame.gameStatus = 'PLAYING';
    this.deckService.shuffleDeck(findGame.deck);

    const deals = this.deckService.dealCards(findGame.deck);

    const player1 = findGame.playersList.find(
      (player) => player.playerId != joinGameDto.playerId,
    );

    if (!player1)
      throw new HttpException('Player 1 nao existe', HttpStatus.BAD_REQUEST);

    player1.hand = deals.player1Hand;
    newPlayer.hand = deals.player2Hand;
    findGame.vira = deals.vira;

    return findGame;
  }

  playCard(gameId: string, playCardDto: PlayCardDto) {
    const game = this.findGame(gameId);

    this.validateCurrentPlayer(game, playCardDto.playerId);

    const player = this.findPlayer(game, playCardDto.playerId);

    const card = this.findCard(player, playCardDto.naipe, playCardDto.value);

    const playedCard = this.removeCard(player, card);

    console.log('Jogador jogou:', player.playerId, playedCard);

    game.currentRound.push({
      playerId: player.playerId,
      card: playedCard,
    });

    console.log('Rodada atual:', game.currentRound);

    if (game.currentRound.length === 2) {
      return this.finishRound(game);
    }

    this.switchTurn(game, player.playerId);

    return game.currentRound;
  }

  // 2. Consulta/debug
  findManilha(gameId: string) {
    const game = this.findGame(gameId);

    const vira = game.vira;

    if (!vira)
      throw new HttpException(
        'Nao foi encontrado a vira dessa rodada',
        HttpStatus.BAD_REQUEST,
      );

    const manilha = this.deckService.getManilha(vira);

    console.log('Vira : ', vira.value);
    console.log('Manilha :', manilha);

    const player1 = game.playersList[0];
    const player1Manilhas = player1.hand.filter(
      (card) => card.value == manilha,
    );

    const player2 = game.playersList[1];
    const player2Manilhas = player2.hand.filter(
      (card) => card.value == manilha,
    );

    return {
      manilha: manilha,
      player1: player1Manilhas,
      player2: player2Manilhas,
    };
  }

  // 3. Fluxo de encerramento
  private finishRound(game: (typeof this.Game)[number]) {
    const winner = this.getRoundWinner(game);

    game.roundWinners.push(winner);
    game.currentRound = [];

    if (this.isHandDrawn(game)) return null;

    const handWinner = this.checkHandWinner(game);

    if (handWinner) {
      this.finishHand(game, handWinner);
      return handWinner;
    }

    if (winner) game.currentPlayerId = winner;

    return winner;
  }

  private finishHand(game: (typeof this.Game)[number], winnerId: string) {
    const winner = this.findPlayer(game, winnerId);

    winner.score += 1;

    game.deck = this.deckService.createDeck();

    this.deckService.shuffleDeck(game.deck);

    const deals = this.deckService.dealCards(game.deck);

    const player1 = game.playersList[0];
    const player2 = game.playersList[1];

    player1.hand = deals.player1Hand;
    player2.hand = deals.player2Hand;

    game.vira = deals.vira;

    game.currentRound = [];
    game.roundWinners = [];
    game.currentPlayerId = winnerId;
  }

  private getRoundWinner(game: (typeof this.Game)[number]): string | null {
    const firstPlay = game.currentRound[0];
    const secondPlay = game.currentRound[1];

    const roundResult = this.deckService.compareCards(
      firstPlay.card,
      secondPlay.card,
      this.deckService.getManilha(game.vira!),
    );

    if (roundResult === 1) return firstPlay.playerId;

    if (roundResult === 2) return secondPlay.playerId;

    return null;
  }

  private checkHandWinner(game: (typeof this.Game)[number]): string | null {
    const player1 = game.playersList[0];
    const player2 = game.playersList[1];

    const player1RoundWins = game.roundWinners.filter(
      (id) => id === player1.playerId,
    );
    const player2RoundWins = game.roundWinners.filter(
      (id) => id === player2.playerId,
    );

    const firstRoundWinner = game.roundWinners[0];
    const secondRoundWinner = game.roundWinners[1];

    if (firstRoundWinner === null) {
      return secondRoundWinner;
    } else if (secondRoundWinner === null) {
      return firstRoundWinner;
    } else {
      if (player1RoundWins.length === 2) return player1.playerId;
      if (player2RoundWins.length === 2) return player2.playerId;
    }

    return null;
  }

  private isHandDrawn(game: (typeof this.Game)[number]): boolean {
    // Duas rodadas empatadas encerram a mão sem vencedor.
    return (
      game.roundWinners.length === 2 &&
      game.roundWinners[0] === null &&
      game.roundWinners[1] === null
    );
  }

  // 4. Validacoes e buscas
  private findGame(gameId: string) {
    const game = this.Game.find((game) => game.id === gameId);

    if (!game)
      throw new HttpException('Jogo nao encontrado', HttpStatus.NOT_FOUND);

    return game;
  }

  private findPlayer(game: (typeof this.Game)[number], playerId: string) {
    const player = game.playersList.find(
      (player) => player.playerId === playerId,
    );

    if (!player)
      throw new HttpException('Jogador nao encontrado', HttpStatus.NOT_FOUND);

    return player;
  }

  private findCard(
    player: (typeof this.Game)[number]['playersList'][number],
    naipe: string,
    value: string,
  ) {
    const card = player.hand.find(
      (ca) => ca.naipe === naipe && ca.value === value,
    );

    if (!card)
      throw new HttpException(
        'Carta nao encontrada na sua mao',
        HttpStatus.NOT_FOUND,
      );

    return card;
  }

  private validateCurrentPlayer(
    game: (typeof this.Game)[number],
    playerId: string,
  ) {
    if (game.currentPlayerId !== playerId)
      throw new HttpException('Nao e sua rodada', HttpStatus.UNAUTHORIZED);
  }

  // 5. Alteracoes simples de estado
  private removeCard(
    player: (typeof this.Game)[number]['playersList'][number],
    card: Carta,
  ) {
    const cardIndex = player.hand.findIndex((handCard) => handCard === card);

    return player.hand.splice(cardIndex, 1)[0];
  }

  private switchTurn(
    game: (typeof this.Game)[number],
    currentPlayerId: string,
  ) {
    const nextPlayer = game.playersList.find(
      (pl) => pl.playerId !== currentPlayerId,
    );

    if (!nextPlayer)
      throw new HttpException(
        'Proximo jogador nao encontrado',
        HttpStatus.NOT_FOUND,
      );

    game.currentPlayerId = nextPlayer.playerId;
  }
}
