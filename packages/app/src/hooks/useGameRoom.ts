import { useEffect, useRef } from 'react';
import { signal, batch } from '@preact/signals-react';
import PartySocket from 'partysocket';

function getClientId(): string {
  const stored = sessionStorage.getItem('game-client-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  sessionStorage.setItem('game-client-id', id);
  return id;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type User = {
  id: string;
  clientId: string;
  name: string;
};

export type State = 'start' | 'playing';

export type Score = Record<string, number>;

export type ServerEvent =
  | { type: 'user-entry'; name: string; clientId: string }
  | { type: 'user-exit'; clientId: string }
  | { type: 'match'; clientId: string }
  | { type: 'start-game' };

export type BroadcastEvent =
  | { type: 'cards-update'; cards: unknown[]; currentIndex: number }
  | { type: 'users-update'; users: User[] }
  | { type: 'score-update'; score: Score }
  | { type: 'matched'; currentIndex: number }
  | { type: 'state-update'; state: State };

export class GameRoomStore {
  users = signal<User[]>([]);
  state = signal<State>('start');
  score = signal<Score>({});
  connectionStatus = signal<ConnectionStatus>('connecting');

  readonly roomId: string;
  private socket: PartySocket;
  readonly clientId = getClientId();
  private playerName: string;
  private messageHandlers: ((event: BroadcastEvent) => void)[] = [];

  constructor(roomId: string, playerName: string) {
    this.roomId = roomId;
    this.playerName = playerName;

    this.socket = new PartySocket({
      host: import.meta.env.VITE_PARTYKIT_HOST,
      room: roomId,
    });

    this.socket.addEventListener('open', () => {
      this.connectionStatus.value = 'connected';
      this.send({
        type: 'user-entry',
        name: this.playerName,
        clientId: this.clientId,
      });
    });

    this.socket.addEventListener('close', () => {
      this.connectionStatus.value = 'disconnected';
    });

    this.socket.addEventListener('message', (e) => {
      const event = JSON.parse(e.data) as BroadcastEvent;
      this.handleMessage(event);
    });
  }

  private handleMessage(event: BroadcastEvent): void {
    switch (event.type) {
      case 'users-update':
        this.users.value = event.users;
        return;
      case 'score-update':
        this.score.value = event.score;
        return;
      case 'state-update':
        this.state.value = event.state;
        return;
    }

    for (const handler of this.messageHandlers) {
      handler(event);
    }
  }

  private send(event: ServerEvent): void {
    this.socket.send(JSON.stringify(event));
  }

  sendMatch(): void {
    this.send({ type: 'match', clientId: this.clientId });
  }

  startGame(): void {
    this.send({ type: 'start-game' });
  }

  onMessage(handler: (event: BroadcastEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  dispose(): void {
    this.messageHandlers = [];
    this.socket.close();
  }
}

export function useGameRoom(
  roomId: string,
  playerName: string,
): GameRoomStore {
  const storeRef = useRef<GameRoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new GameRoomStore(roomId, playerName);
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
      storeRef.current = null;
    };
  }, []);

  return storeRef.current;
}
