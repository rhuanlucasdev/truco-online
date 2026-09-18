import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { DeckService } from './deck/deck.service';
import { GameBroadcast, NoopGameBroadcast } from './game-broadcast';

@Module({
  providers: [
    GameService,
    DeckService,
    { provide: GameBroadcast, useClass: NoopGameBroadcast },
  ],
  controllers: [GameController],
})
export class GameModule {}
