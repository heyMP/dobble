# Server Package (PartyKit)

This package contains the PartyKit server that manages real-time game state via WebSockets. Each game type runs as a separate PartyKit "party" and extends a shared `BaseGameServer` abstract class.

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for the full project architecture.

## Directory Structure

```
server/
  src/
    base-game-server.ts      # Abstract base class -- handles players, phases, scoring
    games/
      dobble/
        server.ts             # DobbleServer extends BaseGameServer
        logic.ts              # Deck generation (finite projective plane), matching
  partykit.json               # Multi-party config
```

## Multi-Party Configuration

Each game is registered as a separate party in `partykit.json`:

```json
{
  "name": "game-server",
  "main": "src/main.ts",
  "parties": {
    "dobble": "src/games/dobble/server.ts"
  }
}
```

Clients connect to a specific party using the `party` option in `PartySocket`:

```typescript
new PartySocket({ host, room: roomId, party: "dobble" });
```

Each party is fully isolated -- separate rooms, separate state, separate server instances.

## BaseGameServer

`BaseGameServer<TGameState, TClientEvent, TBroadcastEvent>` is an abstract class that extends `Party.Server`. It handles all common multiplayer concerns so game implementations only deal with game-specific logic.

### What It Handles Automatically

- **Player management**: Tracks players by connection ID and client ID. Handles join, leave, and reconnect. Broadcasts updated player lists.
- **Phase lifecycle**: Manages transitions between `lobby`, `playing`, and `finished`. Broadcasts phase changes.
- **Score tracking**: Maintains a `Record<clientId, score>` map. Provides `updateScore()` helper. Broadcasts score updates.
- **State sync on connect**: When a new client connects, sends a `room:sync` event with current phase, players, and scores, then calls `getGameStateForClient()` for game-specific state.
- **Message routing**: Parses incoming messages, handles `BaseClientEvent` types internally, delegates everything else to `handleGameEvent()`.

### Abstract Methods to Implement

| Method | Signature | Purpose |
|--------|-----------|---------|
| `createInitialState` | `() => TGameState` | Return the starting state for a new game round |
| `handleGameEvent` | `(event: TClientEvent, sender: Party.Connection) => void` | Process a game-specific client event |
| `getGameStateForClient` | `() => TBroadcastEvent[]` | Return broadcast events to sync a late-joining client |

### Protected Helpers

| Method | Signature | Purpose |
|--------|-----------|---------|
| `broadcastToAll` | `(event: BaseBroadcastEvent \| TBroadcastEvent) => void` | Send to all connected clients |
| `broadcastToOthers` | `(event: object, excludeId: string) => void` | Send to all except one connection |
| `updateScore` | `(clientId: string, delta: number) => void` | Increment score and broadcast |
| `endGame` | `() => void` | Transition to `finished` phase |
| `resetGame` | `() => void` | Reset to `lobby`, reinitialize game state |

## Implementing a New Game Server

1. Create `src/games/<game-id>/server.ts`.
2. Import game types from the `shared` package.
3. Extend `BaseGameServer` with the three type parameters.
4. Implement the three abstract methods.
5. Export the class as the default export.
6. Add the party entry to `partykit.json`.

### Example: Dobble Server

```typescript
import type * as Party from "partykit/server";
import { BaseGameServer } from '../../base-game-server.js';
import type {
  DobbleGameState,
  DobbleClientEvent,
  DobbleBroadcastEvent,
} from 'shared/games/dobble/types';
import { generateDeck } from './logic.js';

export default class DobbleServer extends BaseGameServer<
  DobbleGameState,
  DobbleClientEvent,
  DobbleBroadcastEvent
> {
  createInitialState(): DobbleGameState {
    return { cards: generateDeck(), currentIndex: 0 };
  }

  handleGameEvent(event: DobbleClientEvent, sender: Party.Connection): void {
    if (event.type === 'dobble:match') {
      this.updateScore(event.clientId, 1);
      this.gameState.currentIndex += 2;
      this.broadcastToAll({
        type: 'dobble:matched',
        currentIndex: this.gameState.currentIndex,
      });
    }
  }

  getGameStateForClient(): DobbleBroadcastEvent[] {
    return [{
      type: 'dobble:cards',
      cards: this.gameState.cards,
      currentIndex: this.gameState.currentIndex,
    }];
  }
}
```

## Development

```bash
# Start PartyKit dev server with live reload
npm run dev          # runs: partykit dev --live

# Build TypeScript
npm run build        # runs: tsc

# Deploy to PartyKit
npm run deploy       # runs: partykit deploy
```

## Key PartyKit Concepts

- **Room**: An instance of a party, identified by a room ID. Each room has its own state and connections. Players in the same room share state.
- **Connection**: A WebSocket connection to a room. Has a unique `id` and optional state via `connection.setState()`.
- **Party**: A server class definition. Multiple rooms can exist for the same party.
- **`room.broadcast(msg, [excludeIds])`**: Send a message to all connections in the room, optionally excluding some.
- **`room.getConnections()`**: Iterate over all active connections.
- **`room.storage`**: Per-room key-value storage that persists across server restarts and hibernation.
