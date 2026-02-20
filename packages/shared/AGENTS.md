# Shared Package

This package contains the type contracts and interfaces shared between the frontend app (`packages/app`) and the PartyKit server (`packages/server`). It has no runtime dependencies -- it is types and constants only.

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for the full project architecture.

## What Lives Here

| File | Contents |
|------|----------|
| `src/types.ts` | Core types: `Player`, `GamePhase`, `BaseRoomState` |
| `src/events.ts` | Base event unions: `BaseClientEvent`, `BaseBroadcastEvent` |
| `src/game-definition.ts` | `GameDefinition` interface |
| `src/games/<game>/types.ts` | Per-game types, events, and definition constant |
| `src/index.ts` | Barrel exports for core types |

## Conventions

### Adding Game-Specific Types

When creating types for a new game, place them in `src/games/<game-id>/types.ts`. Each game types file should export:

1. **Game state type** -- The server-side state for this game (e.g. `DobbleGameState`).
2. **Client event union** -- Events the client sends to the server, specific to this game. Prefix event `type` values with the game id (e.g. `dobble:match`).
3. **Broadcast event union** -- Events the server sends to clients, specific to this game. Same prefix convention.
4. **Game definition constant** -- A `GameDefinition` object with metadata. The `id` field must match the party name used in `partykit.json`.

Example structure:

```typescript
// src/games/trivia/types.ts
import type { GameDefinition } from '../../game-definition.js';

export interface TriviaGameState { /* ... */ }

export type TriviaClientEvent =
  | { type: 'trivia:answer'; questionId: string; answer: string };

export type TriviaBroadcastEvent =
  | { type: 'trivia:question'; question: Question }
  | { type: 'trivia:result'; correct: boolean };

export const triviaDefinition: GameDefinition = {
  id: 'trivia',
  name: 'Trivia',
  description: 'Answer questions faster than your opponents!',
  minPlayers: 2,
  maxPlayers: 10,
};
```

### Event Naming

- All event `type` values use colon-separated namespacing: `namespace:action`.
- Base events use generic namespaces: `player:join`, `game:start`, `room:sync`, `phase:changed`.
- Game events use the game id as namespace: `dobble:match`, `trivia:answer`.
- This prevents collisions when base and game events are unioned together.

### Importing

Both `packages/app` and `packages/server` depend on this package via npm workspaces.

```typescript
// Core types
import type { Player, GamePhase } from 'shared';

// Game-specific types
import type { DobbleClientEvent } from 'shared/games/dobble/types';
```
