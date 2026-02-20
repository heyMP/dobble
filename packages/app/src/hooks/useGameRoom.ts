import { useEffect, useRef } from 'react';
import { signal, batch } from '@preact/signals-react';
import PartySocket from 'partysocket';
import type { Player, GamePhase, BaseBroadcastEvent, BaseClientEvent } from 'shared';

function getClientId(): string {
  const stored = sessionStorage.getItem('game-client-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  sessionStorage.setItem('game-client-id', id);
  return id;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const BASE_EVENT_TYPES = new Set([
  'room:sync',
  'player:joined',
  'player:left',
  'scores:updated',
  'phase:changed',
]);

export class GameRoomStore<TBroadcastEvent extends { type: string }> {
  players = signal<Player[]>([]);
  phase = signal<GamePhase>('lobby');
  scores = signal<Record<string, number>>({});
  connectionStatus = signal<ConnectionStatus>('connecting');

  readonly roomId: string;
  private socket: PartySocket;
  readonly clientId = getClientId();
  private playerName: string;
  private gameEventHandlers: ((event: TBroadcastEvent) => void)[] = [];

  constructor(gameType: string, roomId: string, playerName: string) {
    this.roomId = roomId;
    this.playerName = playerName;

    this.socket = new PartySocket({
      host: import.meta.env.VITE_PARTYKIT_HOST,
      room: roomId,
      party: gameType,
    });

    this.socket.addEventListener('open', () => {
      this.connectionStatus.value = 'connected';
      this.send({
        type: 'player:join',
        name: this.playerName,
        clientId: this.clientId,
      } satisfies BaseClientEvent);
    });

    this.socket.addEventListener('close', () => {
      this.connectionStatus.value = 'disconnected';
    });

    this.socket.addEventListener('message', (e) => {
      const event = JSON.parse(e.data) as BaseBroadcastEvent | TBroadcastEvent;
      this.handleMessage(event);
    });
  }

  private handleMessage(event: BaseBroadcastEvent | TBroadcastEvent): void {
    const msg = event as BaseBroadcastEvent;

    switch (msg.type) {
      case 'room:sync':
        batch(() => {
          this.phase.value = msg.phase;
          this.players.value = msg.players;
          this.scores.value = msg.scores;
        });
        return;
      case 'player:joined':
      case 'player:left':
        this.players.value = msg.players;
        return;
      case 'scores:updated':
        this.scores.value = msg.scores;
        return;
      case 'phase:changed':
        this.phase.value = msg.phase;
        return;
    }

    if (!BASE_EVENT_TYPES.has(event.type)) {
      for (const handler of this.gameEventHandlers) {
        handler(event as TBroadcastEvent);
      }
    }
  }

  private send(event: BaseClientEvent | object): void {
    this.socket.send(JSON.stringify(event));
  }

  sendEvent(event: object): void {
    this.send(event);
  }

  startGame(): void {
    this.send({ type: 'game:start' } satisfies BaseClientEvent);
  }

  resetGame(): void {
    this.send({ type: 'game:reset' } satisfies BaseClientEvent);
  }

  onGameEvent(handler: (event: TBroadcastEvent) => void): void {
    this.gameEventHandlers.push(handler);
  }

  dispose(): void {
    this.gameEventHandlers = [];
    this.socket.close();
  }
}

export function useGameRoom<TBroadcastEvent extends { type: string }>(
  gameType: string,
  roomId: string,
  playerName: string,
): GameRoomStore<TBroadcastEvent> {
  const storeRef = useRef<GameRoomStore<TBroadcastEvent> | null>(null);

  if (!storeRef.current) {
    storeRef.current = new GameRoomStore<TBroadcastEvent>(gameType, roomId, playerName);
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
      storeRef.current = null;
    };
  }, []);

  return storeRef.current;
}
