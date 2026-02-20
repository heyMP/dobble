# App Package (React SPA)

The frontend is a React single-page application built with Vite and TypeScript. It connects to the PartyKit server via WebSockets for real-time multiplayer gameplay.

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for the full project architecture.

## Scaffolding

This app is scaffolded using the official Vite React TypeScript template:

```bash
npm create vite@latest packages/app -- --template react-ts
```

Additional dependencies:

- `partysocket` -- PartyKit WebSocket client
- `react-router-dom` -- Client-side SPA routing
- `@preact/signals-react` -- State management

## Directory Structure

```
app/
  src/
    App.tsx                    # Root component with react-router-dom routes
    hooks/
      useGameRoom.ts           # Generic hook wrapping GameRoomStore
    games/
      registry.ts              # Maps game IDs to components + definitions
      dobble/
        DobbleGame.tsx          # Dobble game UI component
    pages/
      Home.tsx                 # Game selection page
      Lobby.tsx                # Pre-game waiting room (shared across games)
  vite.config.ts
  index.html
```

## State Management: Preact Signals

All state management uses **Preact Signals** (`@preact/signals-react`). Do not use `useState` or `useReducer` for game state.

### Key APIs

| API | Purpose |
|-----|---------|
| `signal(value)` | Create a reactive container. Read/write via `.value`. |
| `computed(() => ...)` | Derived signal that auto-updates when dependencies change. |
| `effect(() => ...)` | Side effect that runs when accessed signals change. |
| `batch(() => ...)` | Group multiple signal writes into a single render. |
| `useSignal(value)` | Component-local signal (hook form, tied to component lifecycle). |

### Rules

- Access `.value` directly in JSX so React can do fine-grained DOM updates without re-rendering the full component.
- Update complex objects/arrays immutably: `list.value = [...list.value, item]`.
- Use `computed` for expensive derivations to cache results.
- Use `batch()` when updating multiple signals in one handler.

See `.cursor/skills/react-signals/SKILL.md` for full guidance and examples.

## GameRoomStore

`GameRoomStore<TBroadcastEvent>` is a generic class that manages the PartySocket connection and exposes room state as signals. It handles:

- Connecting to the correct PartyKit party via `PartySocket`
- Sending `player:join` on open, handling reconnects
- Parsing incoming messages and routing base vs game events
- Exposing `players`, `phase`, `scores`, and `connectionStatus` as signals

```typescript
class GameRoomStore<TBroadcastEvent extends { type: string }> {
  players = signal<Player[]>([]);
  phase = signal<GamePhase>('lobby');
  scores = signal<Record<string, number>>({});
  connectionStatus = signal<'connecting' | 'connected' | 'disconnected'>('connecting');

  sendEvent(event: object): void;
  startGame(): void;
  onGameEvent(handler: (event: TBroadcastEvent) => void): void;
  dispose(): void;
}
```

### useGameRoom Hook

A thin React hook that creates a `GameRoomStore` and disposes it on unmount:

```typescript
function useGameRoom<TBroadcastEvent extends { type: string }>(
  gameType: string,    // party name in partykit.json, e.g. "dobble"
  roomId: string,
  playerName: string
): GameRoomStore<TBroadcastEvent>;
```

## Game Registry

`src/games/registry.ts` maps game IDs to their React component and `GameDefinition`:

```typescript
import { DobbleGame } from './dobble/DobbleGame';
import { dobbleDefinition } from 'shared/games/dobble/types';

export const gameRegistry = {
  dobble: { component: DobbleGame, definition: dobbleDefinition },
} as const;

export type GameId = keyof typeof gameRegistry;
```

The registry drives:
- The home page game list (iterate `Object.values(gameRegistry)`)
- Dynamic routing (the game ID in the URL maps to a registry entry)

## Implementing a New Game UI

1. Create `src/games/<game-id>/` directory.
2. Create the main game component (e.g. `TriviaGame.tsx`).
3. Use `useGameRoom` with the game's broadcast event type.
4. Use `useSignal` for game-specific local state.
5. Register in `src/games/registry.ts`.

### Example: Game Component

```tsx
import { useSignal } from '@preact/signals-react';
import { useGameRoom } from '../../hooks/useGameRoom';
import type { TriviaBroadcastEvent, Question } from 'shared/games/trivia/types';

interface Props {
  roomId: string;
  playerName: string;
}

export function TriviaGame({ roomId, playerName }: Props) {
  const room = useGameRoom<TriviaBroadcastEvent>('trivia', roomId, playerName);
  const currentQuestion = useSignal<Question | null>(null);

  room.onGameEvent((event) => {
    if (event.type === 'trivia:question') {
      currentQuestion.value = event.question;
    }
  });

  if (room.phase.value === 'lobby') {
    return (
      <div>
        <p>Players: {room.players.value.map(p => p.name).join(', ')}</p>
        <button onClick={() => room.startGame()}>Start Game</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{currentQuestion.value?.text}</h2>
      {currentQuestion.value?.options.map(opt => (
        <button
          key={opt}
          onClick={() => room.sendEvent({ type: 'trivia:answer', answer: opt })}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
```

## Routing

The app uses `react-router-dom` with these routes:

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Home` | Game selection |
| `/:gameId` | `Lobby` | Enter name, create/join room |
| `/:gameId/:roomId` | Game component (from registry) | Active gameplay |

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_PARTYKIT_HOST` | PartyKit server host | `localhost:1999` (dev), `your-project.partykit.dev` (prod) |

## Development

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
```
