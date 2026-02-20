import type * as Party from "partykit/server";
import type { Player, GamePhase } from 'shared';
import type { BaseClientEvent, BaseBroadcastEvent } from 'shared';

export abstract class BaseGameServer<
  TGameState,
  TClientEvent extends { type: string },
  TBroadcastEvent extends { type: string },
> implements Party.Server {
  constructor(readonly room: Party.Room) {}

  protected players: Player[] = [];
  protected phase: GamePhase = 'lobby';
  protected scores: Record<string, number> = {};
  protected gameState!: TGameState;

  abstract createInitialState(): TGameState;
  abstract handleGameEvent(event: TClientEvent, sender: Party.Connection): void;
  abstract getGameStateForClient(): TBroadcastEvent[];

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.sendTo(conn, {
      type: 'room:sync',
      phase: this.phase,
      players: this.players,
      scores: this.scores,
    });

    for (const event of this.getGameStateForClient()) {
      this.sendTo(conn, event);
    }
  }

  onClose(connection: Party.Connection): void | Promise<void> {
    this.removePlayer(connection.id);
  }

  onMessage(message: string, sender: Party.Connection) {
    const event = JSON.parse(message) as BaseClientEvent | TClientEvent;

    switch (event.type) {
      case 'player:join':
        this.addPlayer({
          id: sender.id,
          clientId: (event as Extract<BaseClientEvent, { type: 'player:join' }>).clientId,
          name: (event as Extract<BaseClientEvent, { type: 'player:join' }>).name,
        });
        return;

      case 'player:leave':
        this.removePlayer(sender.id);
        return;

      case 'game:start':
        this.startGame();
        return;

      case 'game:reset':
        this.resetGame();
        return;

      default:
        this.handleGameEvent(event as TClientEvent, sender);
    }
  }

  private addPlayer(player: Player) {
    const existing = this.players.findIndex(p => p.clientId === player.clientId);

    if (existing !== -1) {
      this.players[existing] = player;
    } else {
      this.players.push(player);
    }

    this.broadcastToAll({ type: 'player:joined', players: this.players });
  }

  private removePlayer(connectionId: string) {
    this.players = this.players.filter(p => p.id !== connectionId);
    this.broadcastToAll({ type: 'player:left', players: this.players });
  }

  private startGame() {
    this.gameState = this.createInitialState();
    this.phase = 'playing';
    this.scores = {};
    this.broadcastToAll({ type: 'phase:changed', phase: this.phase });
  }

  protected broadcastToAll(event: BaseBroadcastEvent | TBroadcastEvent) {
    this.room.broadcast(JSON.stringify(event));
  }

  protected broadcastToOthers(event: BaseBroadcastEvent | TBroadcastEvent, excludeId: string) {
    this.room.broadcast(JSON.stringify(event), [excludeId]);
  }

  protected updateScore(clientId: string, delta: number) {
    this.scores[clientId] = (this.scores[clientId] ?? 0) + delta;
    this.broadcastToAll({ type: 'scores:updated', scores: this.scores });
  }

  protected endGame() {
    this.phase = 'finished';
    this.broadcastToAll({ type: 'phase:changed', phase: this.phase });
  }

  protected resetGame() {
    this.phase = 'lobby';
    this.scores = {};
    this.gameState = this.createInitialState();
    this.broadcastToAll({ type: 'phase:changed', phase: this.phase });
    this.broadcastToAll({ type: 'scores:updated', scores: this.scores });
  }

  private sendTo(conn: Party.Connection, event: BaseBroadcastEvent | TBroadcastEvent) {
    conn.send(JSON.stringify(event));
  }
}
