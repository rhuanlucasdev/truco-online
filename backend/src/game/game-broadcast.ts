import { Injectable } from '@nestjs/common';

/** Sync de estado pra clientes conectados (Socket.IO em local; no-op na Vercel). */
export abstract class GameBroadcast {
  abstract broadcastGame(gameId: string): Promise<void>;
  abstract broadcastGameEnded(gameId: string): Promise<void>;
}

/**
 * Vercel Functions não seguram Socket.IO bem — o front já faz polling.
 * Localmente o GameGateway pode substituir este provider depois.
 */
@Injectable()
export class NoopGameBroadcast extends GameBroadcast {
  async broadcastGame(_gameId: string): Promise<void> {
    return;
  }

  async broadcastGameEnded(_gameId: string): Promise<void> {
    return;
  }
}
