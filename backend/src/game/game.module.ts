import { Module } from '@nestjs/common';
import { GameService } from './game.service.js';
import { GameController } from './game.controller.js';
import { GameGateway } from './game.gateway.js';
import { DeckService } from './deck/deck.service.js';

@Module({
  providers: [GameService, DeckService, GameGateway],
  controllers: [GameController],
})
export class GameModule {}
