import { Module } from '@nestjs/common';
import { GameService } from './game.service.js';
import { GameController } from './game.controller.js';
import { GameGateway } from './game.gateway.js';
import { DeckService } from './deck/deck.service.js';

/**
 * No Vercel Functions, Socket.IO costuma derrubar o bootstrap (sem WS longo).
 * Mantemos um gateway no-op pra o REST funcionar; sync realtime fica pro local/dev.
 */
const noopGateway: Pick<
  GameGateway,
  'broadcastGame' | 'broadcastGameEnded'
> = {
  broadcastGame: async () => undefined,
  broadcastGameEnded: async () => undefined,
};

const useRealtime = !process.env.VERCEL;

@Module({
  providers: [
    GameService,
    DeckService,
    useRealtime
      ? GameGateway
      : { provide: GameGateway, useValue: noopGateway },
  ],
  controllers: [GameController],
})
export class GameModule {}
