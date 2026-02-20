import PartySocket from "partysocket";
import { signal, batch } from "@preact/signals-react";
import type {
  Player,
  GamePhase,
  BaseClientEvent,
  BaseBroadcastEvent,
} from "shared";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const CLIENT_ID_KEY = "dobble-game-client-id";

function getOrCreateClientId(): string {
  let id = sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export class GameRoomStore<TBroadcastEvent extends { type: string }> {
  readonly players = signal<Player[]>([]);
  readonly phase = signal<GamePhase>("lobby");
  readonly scores = signal<Record<string, number>>({});
  readonly connectionStatus = signal<ConnectionStatus>("connecting");

  readonly clientId: string;
  private socket: PartySocket;
  private gameEventHandler: ((event: TBroadcastEvent) => void) | null = null;
  private playerName: string;

  constructor(
    host: string,
    gameType: string,
    roomId: string,
    playerName: string,
  ) {
    this.playerName = playerName;
    this.clientId = getOrCreateClientId();

    this.socket = new PartySocket({
      host,
      room: roomId,
      party: gameType,
    });

    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("message", this.handleMessage);
  }

  sendEvent(event: BaseClientEvent | (TBroadcastEvent & { type: string })): void {
    this.socket.send(JSON.stringify(event));
  }

  startGame(): void {
    this.sendEvent({ type: "game:start" } as BaseClientEvent);
  }

  resetGame(): void {
    this.sendEvent({ type: "game:reset" } as BaseClientEvent);
  }

  onGameEvent(handler: (event: TBroadcastEvent) => void): void {
    this.gameEventHandler = handler;
  }

  dispose(): void {
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.close();
  }

  private handleOpen = () => {
    this.connectionStatus.value = "connected";
    this.sendEvent({
      type: "player:join",
      name: this.playerName,
      clientId: this.clientId,
    } as BaseClientEvent);
  };

  private handleClose = () => {
    this.connectionStatus.value = "disconnected";
  };

  private handleMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data as string) as
      | BaseBroadcastEvent
      | TBroadcastEvent;

    switch (data.type) {
      case "room:sync": {
        const sync = data as Extract<BaseBroadcastEvent, { type: "room:sync" }>;
        batch(() => {
          this.players.value = sync.players;
          this.phase.value = sync.phase;
          this.scores.value = sync.scores;
        });
        break;
      }
      case "player:joined": {
        const joined = data as Extract<BaseBroadcastEvent, { type: "player:joined" }>;
        this.players.value = joined.players;
        break;
      }
      case "player:left": {
        const left = data as Extract<BaseBroadcastEvent, { type: "player:left" }>;
        this.players.value = left.players;
        break;
      }
      case "scores:updated": {
        const scores = data as Extract<BaseBroadcastEvent, { type: "scores:updated" }>;
        this.scores.value = scores.scores;
        break;
      }
      case "phase:changed": {
        const phase = data as Extract<BaseBroadcastEvent, { type: "phase:changed" }>;
        this.phase.value = phase.phase;
        break;
      }
      default:
        this.gameEventHandler?.(data as TBroadcastEvent);
    }
  };
}
