/**
 * =============================================================================
 * WebSocket (Socket.IO) — versão SIMPLES e bem comentada
 * =============================================================================
 *
 * Por que WebSocket?
 *   REST sozinho funciona (criar / entrar / jogar), mas o *outro* jogador
 *   só descobriria a mudança se ficasse perguntando “mudou?” (polling).
 *   O socket deixa o servidor *empurrar* o estado novo assim que algo acontece.
 *
 * Fluxo mental:
 *   1) Browser abre conexão Socket.IO com o Nest (mesmo host:porta do HTTP).
 *   2) Cliente manda evento `room:join` com { gameId, playerId }.
 *   3) Servidor coloca esse socket numa “sala” `game:<id>` (conceito do Socket.IO:
 *      broadcast só pra quem está naquela sala).
 *   4) Quando REST altera o jogo (join ou play), o Controller chama
 *      `broadcastGame(gameId)` → cada socket da sala recebe `game:state`
 *      com a visão filtrada daquele jogador (sem ver a mão do outro).
 *
 * Ainda usamos REST para as ações (create/join/play). O socket aqui é só
 * “rádio” de sincronização — mais fácil de entender do que mover toda a
 * lógica de jogo para dentro dos handlers WS.
 * =============================================================================
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

/** Payload que o frontend manda ao entrar na “sala” da partida. */
type RoomJoinPayload = {
  gameId: string;
  playerId: string;
};

/**
 * cors: origin '*' — ok em dev local.
 * Em produção você restringiria ao domínio do frontend.
 *
 * Não precisamos de path custom: Socket.IO usa /socket.io/ por padrão.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  /**
   * Instância do servidor Socket.IO injetada pelo Nest.
   * Com ela emitimos eventos pra um socket, pra uma sala, ou pra todos.
   */
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  /**
   * Cliente → servidor: "quero ouvir atualizações desta partida".
   *
   * @SubscribeMessage('room:join') = nome do evento que o FE deve emitir.
   * Exemplo no frontend: socket.emit('room:join', { gameId, playerId })
   */
  @SubscribeMessage('room:join')
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: RoomJoinPayload,
  ) {
    const { gameId, playerId } = body;

    if (!gameId || !playerId) {
      // Ack simples de erro (opcional). O FE pode ignorar ou mostrar toast.
      return { ok: false, error: 'gameId e playerId são obrigatórios' };
    }

    // Guarda quem é esse socket — usamos depois no broadcast personalizado.
    client.data.gameId = gameId;
    client.data.playerId = playerId;

    // Entra na sala Socket.IO. Vários clients (P1 e P2) podem estar na mesma.
    void client.join(this.roomName(gameId));

    // Já manda o estado atual (útil se o host conectou antes do join do P2,
    // ou se alguém recarregou a página no meio do jogo).
    try {
      const view = this.gameService.getGameForPlayer(gameId, playerId);
      client.emit('game:state', view);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível entrar na sala';
      return { ok: false, error: message };
    }
  }

  /**
   * Chamado pelo REST (controller) depois de joinGame / playCard.
   * Empurra um `game:state` personalizado para CADA socket da sala.
   *
   * Por que personalizado?
   *   Porque P1 não pode receber a mão do P2 (e vice-versa).
   *   Se emitíssemos o mesmo JSON pra sala inteira, vazaríamos as cartas.
   */
  async broadcastGame(gameId: string) {
    const room = this.roomName(gameId);
    const sockets = await this.server.in(room).fetchSockets();

    for (const socket of sockets) {
      const playerId = socket.data.playerId as string | undefined;
      if (!playerId) continue;

      try {
        const view = this.gameService.getGameForPlayer(gameId, playerId);
        socket.emit('game:state', view);
      } catch {
        // Jogador sumiu do estado / id inválido — ignora esse socket.
      }
    }
  }

  /**
   * Mesa apagada pelo anfitrião.
   * Todos na sala recebem `game:ended` e devem voltar ao lobby.
   */
  async broadcastGameEnded(gameId: string) {
    const room = this.roomName(gameId);
    this.server.to(room).emit('game:ended', { gameId });

    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      void socket.leave(room);
    }
  }

  /** Convenção de nome da sala — um lugar só pra não errar typo. */
  private roomName(gameId: string) {
    return `game:${gameId}`;
  }
}
