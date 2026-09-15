import { Module } from '@nestjs/common';
import { GameService } from './game.service.js';
import { GameController } from './game.controller.js';
import { DeckService } from './deck/deck.service.js';

@Module({
  providers: [GameService, DeckService],
  controllers: [GameController],
})
export class GameModule {}
