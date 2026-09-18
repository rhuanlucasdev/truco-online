import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';
import { GameBroadcast } from './game-broadcast';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { PlayCardDto } from './dto/play-card.dto';
import { DeleteGameDto } from './dto/delete-game.dto';
import { LeaveGameDto } from './dto/leave-game.dto';
import { SetTeamDto } from './dto/set-team.dto';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameBroadcast: GameBroadcast,
  ) {}

  @Post()
  create(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createGame(createGameDto);
  }

  @Patch(':id')
  async join(
    @Param('id') gameId: string,
    @Body() joinGameDto: JoinGameDto,
  ) {
    this.gameService.joinGame(gameId, joinGameDto);
    await this.gameBroadcast.broadcastGame(gameId);
    return this.gameService.getGameForPlayer(gameId, joinGameDto.playerId);
  }

  @Post(':id/leave')
  async leave(
    @Param('id') gameId: string,
    @Body() body: LeaveGameDto,
  ) {
    const result = this.gameService.leaveGame(gameId, body.playerId);

    if (result.deleted) {
      await this.gameBroadcast.broadcastGameEnded(gameId);
    } else {
      await this.gameBroadcast.broadcastGame(gameId);
    }

    return result;
  }

  @Post(':id/team')
  async setTeam(
    @Param('id') gameId: string,
    @Body() body: SetTeamDto,
  ) {
    const view = this.gameService.setTeam(gameId, body.playerId, body.teamId);
    await this.gameBroadcast.broadcastGame(gameId);
    return view;
  }

  @Get(':id/manilha')
  findManilha(@Param('id') gameId: string) {
    return this.gameService.findManilha(gameId);
  }

  @Get(':id')
  getForPlayer(
    @Param('id') gameId: string,
    @Query('playerId') playerId: string,
  ) {
    return this.gameService.getGameForPlayer(gameId, playerId);
  }

  @Post(':id/play')
  async playCard(
    @Param('id') gameId: string,
    @Body() playCardDto: PlayCardDto,
  ) {
    const view = this.gameService.playCard(gameId, playCardDto);
    await this.gameBroadcast.broadcastGame(gameId);
    return view;
  }

  @Delete(':id')
  async deleteGame(
    @Param('id') gameId: string,
    @Body() body: DeleteGameDto,
  ) {
    const result = this.gameService.deleteGame(gameId, body.playerId);
    await this.gameBroadcast.broadcastGameEnded(gameId);
    return result;
  }
}
