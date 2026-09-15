import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GameService } from './game.service.js';
import { CreateGameDto } from './dto/create-game.dto.js';
import { JoinGameDto } from './dto/join-game.dto.js';
import { PlayCardDto } from './dto/play-card.dto.js';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createGame(createGameDto);
  }

  @Patch(':id')
  join(@Param('id') gameId: string, @Body() joinGameDto: JoinGameDto) {
    return this.gameService.joinGame(gameId, joinGameDto);
  }

  @Get(':id/manilha')
  findManilha(@Param('id') gameId: string) {
    return this.gameService.findManilha(gameId);
  }

  @Post(':id/play')
  playCard(@Param('id') gameId: string, @Body() playCardDto: PlayCardDto) {
    return this.gameService.playCard(gameId, playCardDto);
  }
}
